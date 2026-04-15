const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all transactions with filters
router.get('/', async (req, res) => {
  try {
    const { type, category_id, month, year, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
             a.name AS account_name, a.type AS account_type, a.color AS account_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (type) { query += ' AND t.type = ?'; params.push(type); }
    if (category_id) { query += ' AND t.category_id = ?'; params.push(category_id); }
    if (month) { query += ' AND MONTH(t.date) = ?'; params.push(month); }
    if (year) { query += ' AND YEAR(t.date) = ?'; params.push(year); }

    query += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET summary (total income, expense, balance)
router.get('/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (month) { where += ' AND MONTH(date) = ?'; params.push(month); }
    if (year) { where += ' AND YEAR(date) = ?'; params.push(year); }

    const [summary] = await db.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
       FROM transactions ${where}`,
      params
    );

    const income = parseFloat(summary[0].total_income);
    const expense = parseFloat(summary[0].total_expense);
    res.json({ total_income: income, total_expense: expense, balance: income - expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET monthly chart data (last 6 months)
router.get('/monthly-chart', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(date, '%Y-%m') AS month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
      FROM transactions
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET expense by category (for pie chart)
router.get('/by-category', async (req, res) => {
  try {
    const { month, year } = req.query;
    let where = "WHERE t.type = 'expense'";
    const params = [];

    if (month) { where += ' AND MONTH(t.date) = ?'; params.push(month); }
    if (year) { where += ' AND YEAR(t.date) = ?'; params.push(year); }

    const [rows] = await db.query(
      `SELECT c.name, c.color, COALESCE(SUM(t.amount), 0) AS total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       ${where}
       GROUP BY t.category_id, c.name, c.color
       ORDER BY total DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET daily chart data for a given month/year
router.get('/daily-chart', async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month || (new Date().getMonth() + 1);
    const y = year || new Date().getFullYear();

    const [rows] = await db.query(
      `SELECT DAY(date) AS day,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE MONTH(date) = ? AND YEAR(date) = ?
       GROUP BY DAY(date)
       ORDER BY day ASC`,
      [m, y]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single transaction
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, c.name AS category_name, c.color AS category_color,
              a.name AS account_name, a.type AS account_type, a.color AS account_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create transaction
router.post('/', async (req, res) => {
  try {
    const { title, amount, type, category_id, account_id, description, date } = req.body;
    if (!title || !amount || !type || !date) {
      return res.status(400).json({ error: 'Title, amount, type, and date are required' });
    }
    const [result] = await db.query(
      'INSERT INTO transactions (title, amount, type, category_id, account_id, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, amount, type, category_id || null, account_id || null, description || null, date]
    );
    const [rows] = await db.query(
      `SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
              a.name AS account_name, a.type AS account_type, a.color AS account_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update transaction
router.put('/:id', async (req, res) => {
  try {
    const { title, amount, type, category_id, account_id, description, date } = req.body;
    await db.query(
      'UPDATE transactions SET title=?, amount=?, type=?, category_id=?, account_id=?, description=?, date=? WHERE id=?',
      [title, amount, type, category_id || null, account_id || null, description || null, date, req.params.id]
    );
    const [rows] = await db.query(
      `SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
              a.name AS account_name, a.type AS account_type, a.color AS account_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ?`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE transaction
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
