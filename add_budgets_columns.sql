-- Run this in phpMyAdmin to add the missing columns to the budgets table.

USE budget_planner;

-- Add period_type column if missing
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS period_type ENUM('monthly','weekly') NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS week TINYINT NOT NULL DEFAULT 0;

-- Add unique key if it doesn't already exist
-- (skip if you get a "Duplicate key name" error — it means it already exists)
ALTER TABLE budgets
  ADD UNIQUE KEY unique_budget (category_id, month, year, week);

-- Fix accounts.type to VARCHAR so existing values like 'e-wallet' are preserved
ALTER TABLE accounts
  MODIFY COLUMN type VARCHAR(50) NOT NULL DEFAULT 'checking';
