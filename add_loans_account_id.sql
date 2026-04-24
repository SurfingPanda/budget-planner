-- Adds the account_id column to the loans table so loan payments
-- can be linked back to an account (used by New Loan + Transaction).

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS account_id INT DEFAULT NULL,
  ADD CONSTRAINT fk_loans_account
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;
