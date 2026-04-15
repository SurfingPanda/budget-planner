-- Run this in phpMyAdmin if you already imported schema.sql previously.
-- This adds the accounts table and account_id column to transactions.

USE budget_planner;

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('checking', 'savings', 'credit-card', 'cash', 'investment', 'other') NOT NULL DEFAULT 'checking',
  initial_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  color VARCHAR(20) DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add account_id to transactions if it doesn't exist
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS account_id INT DEFAULT NULL,
  ADD CONSTRAINT fk_transactions_account
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;
