-- Create beta_submissions table
CREATE TABLE IF NOT EXISTS beta_submissions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_beta_submissions_email ON beta_submissions(email);

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_beta_submissions_created_at ON beta_submissions(created_at);