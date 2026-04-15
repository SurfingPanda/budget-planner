const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all accounts with computed current balance
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        a.*,
        a.initial_balance +
          COALESCE(SUM(CASE WHEN t.type = 'income'  THEN t.amount ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
        AS current_balance,
        COUNT(t.id) AS transaction_count
      FROM accounts a
      LEFT JOIN transactions t ON t.account_id = a.id
      GROUP BY a.id
      ORDER BY a.created_at ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single account
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        a.*,
        a.initial_balance +
          COALESCE(SUM(CASE WHEN t.type = 'income'  THEN t.amount ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
        AS current_balance
      FROM accounts a
      LEFT JOIN transactions t ON t.account_id = a.id
      WHERE a.id = ?
      GROUP BY a.id
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Account not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create account
router.post('/', async (req, res) => {
  try {
    const { name, type, initial_balance = 0, color } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });
    const [result] = await db.query(
      'INSERT INTO accounts (name, type, initial_balance, color) VALUES (?, ?, ?, ?)',
      [name.trim(), type, parseFloat(initial_balance) || 0, color || '#6366f1']
    );
    const [rows] = await db.query('SELECT * FROM accounts WHERE id = ?', [result.insertId]);
    res.status(201).json({ ...rows[0], current_balance: rows[0].initial_balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update account
router.put('/:id', async (req, res) => {
  try {
    const { name, type, initial_balance, color } = req.body;
    await db.query(
      'UPDATE accounts SET name=?, type=?, initial_balance=?, color=? WHERE id=?',
      [name, type, parseFloat(initial_balance) || 0, color, req.params.id]
    );
    const [rows] = await db.query(`
      SELECT a.*,
        a.initial_balance +
          COALESCE(SUM(CASE WHEN t.type='income' THEN t.amount ELSE 0 END),0) -
          COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount ELSE 0 END),0)
        AS current_balance
      FROM accounts a LEFT JOIN transactions t ON t.account_id = a.id
      WHERE a.id=? GROUP BY a.id
    `, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE account
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM accounts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
