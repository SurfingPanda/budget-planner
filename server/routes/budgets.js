const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: SQL date-range condition for weekly budgets
// week 1 = days 1-7, week 2 = days 8-14, ... week 5 = days 29-end
const weekCondition = `
  AND DAY(t.date) BETWEEN ((b.week - 1) * 7 + 1)
    AND LEAST(b.week * 7, DAY(LAST_DAY(DATE(CONCAT(b.year, '-', LPAD(b.month, 2, '0'), '-01')))))
`;

// GET budgets for a given period with spending info
router.get('/', async (req, res) => {
  try {
    const { month, year, period_type = 'monthly', week = 0 } = req.query;
    const m = month || (new Date().getMonth() + 1);
    const y = year || new Date().getFullYear();
    const w = parseInt(week);

    const spentSubquery = period_type === 'weekly'
      ? `SELECT SUM(t.amount) FROM transactions t
         WHERE t.category_id = b.category_id
           AND MONTH(t.date) = b.month AND YEAR(t.date) = b.year
           AND t.type = 'expense'
           ${weekCondition}`
      : `SELECT SUM(t.amount) FROM transactions t
         WHERE t.category_id = b.category_id
           AND MONTH(t.date) = b.month AND YEAR(t.date) = b.year
           AND t.type = 'expense'`;

    const [rows] = await db.query(
      `SELECT b.*, c.name AS category_name, c.color, c.icon,
        COALESCE((${spentSubquery}), 0) AS spent
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.month = ? AND b.year = ? AND b.period_type = ? AND b.week = ?
       ORDER BY c.name ASC`,
      [m, y, period_type, w]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create or update budget (upsert)
router.post('/', async (req, res) => {
  try {
    const { category_id, amount, month, year, period_type = 'monthly', week = 0 } = req.body;
    if (!category_id || !amount || !month || !year) {
      return res.status(400).json({ error: 'category_id, amount, month, and year are required' });
    }

    await db.query(
      `INSERT INTO budgets (category_id, amount, month, year, period_type, week)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [category_id, amount, month, year, period_type, parseInt(week)]
    );

    const spentSubquery = period_type === 'weekly'
      ? `SELECT SUM(t.amount) FROM transactions t
         WHERE t.category_id = b.category_id
           AND MONTH(t.date) = b.month AND YEAR(t.date) = b.year
           AND t.type = 'expense'
           ${weekCondition}`
      : `SELECT SUM(t.amount) FROM transactions t
         WHERE t.category_id = b.category_id
           AND MONTH(t.date) = b.month AND YEAR(t.date) = b.year
           AND t.type = 'expense'`;

    const [rows] = await db.query(
      `SELECT b.*, c.name AS category_name, c.color, c.icon,
        COALESCE((${spentSubquery}), 0) AS spent
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.category_id = ? AND b.month = ? AND b.year = ? AND b.period_type = ? AND b.week = ?`,
      [category_id, month, year, period_type, parseInt(week)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE budget
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM budgets WHERE id = ?', [req.params.id]);
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
