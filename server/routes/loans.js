const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all loans
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM loans';
    const params = [];
    if (status) { query += ' WHERE status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single loan
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM loans WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Loan not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create loan
router.post('/', async (req, res) => {
  try {
    const {
      name, type, principal_amount, remaining_balance,
      monthly_payment, is_recurring, payment_day,
      start_date, due_date, notes,
    } = req.body;

    if (!name || !type || !principal_amount || !start_date) {
      return res.status(400).json({ error: 'name, type, principal_amount, and start_date are required' });
    }

    const [result] = await db.query(
      `INSERT INTO loans
        (name, type, principal_amount, remaining_balance, monthly_payment,
         is_recurring, payment_day, start_date, due_date, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        name.trim(), type,
        parseFloat(principal_amount),
        parseFloat(remaining_balance ?? principal_amount),
        monthly_payment ? parseFloat(monthly_payment) : null,
        is_recurring ? 1 : 0,
        payment_day ? parseInt(payment_day) : null,
        start_date,
        due_date || null,
        notes || null,
      ]
    );

    const [rows] = await db.query('SELECT * FROM loans WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update loan
router.put('/:id', async (req, res) => {
  try {
    const {
      name, type, principal_amount, remaining_balance,
      monthly_payment, is_recurring, payment_day,
      start_date, due_date, notes, status,
    } = req.body;

    await db.query(
      `UPDATE loans SET
        name=?, type=?, principal_amount=?, remaining_balance=?,
        monthly_payment=?, is_recurring=?, payment_day=?,
        start_date=?, due_date=?, notes=?, status=?
       WHERE id=?`,
      [
        name.trim(), type,
        parseFloat(principal_amount),
        parseFloat(remaining_balance),
        monthly_payment ? parseFloat(monthly_payment) : null,
        is_recurring ? 1 : 0,
        payment_day ? parseInt(payment_day) : null,
        start_date,
        due_date || null,
        notes || null,
        status || 'active',
        req.params.id,
      ]
    );

    const [rows] = await db.query('SELECT * FROM loans WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH mark as paid off
router.patch('/:id/pay-off', async (req, res) => {
  try {
    await db.query(
      "UPDATE loans SET status='paid_off', remaining_balance=0 WHERE id=?",
      [req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM loans WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH make a monthly payment (deducts monthly_payment from remaining_balance)
router.patch('/:id/pay-month', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM loans WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Loan not found' });
    const loan = rows[0];
    const newBalance = Math.max(0, parseFloat(loan.remaining_balance) - parseFloat(loan.monthly_payment));
    const newStatus = newBalance <= 0 ? 'paid_off' : 'active';
    await db.query(
      'UPDATE loans SET remaining_balance = ?, status = ? WHERE id = ?',
      [newBalance, newStatus, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM loans WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE loan
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM loans WHERE id = ?', [req.params.id]);
    res.json({ message: 'Loan deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
