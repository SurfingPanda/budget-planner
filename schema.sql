-- Budget Planner Database Schema
-- Run this in phpMyAdmin or MySQL CLI

CREATE DATABASE IF NOT EXISTS budget_planner;
USE budget_planner;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  icon VARCHAR(50) DEFAULT 'tag',
  color VARCHAR(20) DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('checking', 'savings', 'credit-card', 'cash', 'investment', 'other') NOT NULL DEFAULT 'checking',
  initial_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  color VARCHAR(20) DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  category_id INT,
  account_id INT,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  month INT NOT NULL,   -- 1-12
  year INT NOT NULL,
  period_type ENUM('monthly','weekly') NOT NULL DEFAULT 'monthly',
  week TINYINT NOT NULL DEFAULT 0,  -- 0 = monthly, 1-5 = week of month
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_budget (category_id, month, year, week),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Seed default categories
INSERT INTO categories (name, type, icon, color) VALUES
  ('Salary', 'income', 'briefcase', '#22c55e'),
  ('Freelance', 'income', 'laptop', '#10b981'),
  ('Investments', 'income', 'trending-up', '#06b6d4'),
  ('Other Income', 'income', 'plus-circle', '#84cc16'),
  ('Housing', 'expense', 'home', '#f43f5e'),
  ('Food & Dining', 'expense', 'utensils', '#f97316'),
  ('Transportation', 'expense', 'car', '#eab308'),
  ('Health', 'expense', 'heart', '#ec4899'),
  ('Entertainment', 'expense', 'film', '#8b5cf6'),
  ('Shopping', 'expense', 'shopping-bag', '#3b82f6'),
  ('Utilities', 'expense', 'zap', '#14b8a6'),
  ('Education', 'expense', 'book', '#6366f1'),
  ('Travel', 'expense', 'map', '#f59e0b'),
  ('Other Expense', 'expense', 'minus-circle', '#6b7280');
