-- Initialize the healthchatbot database
-- This script runs when the PostgreSQL container starts

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE healthchatbot'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'healthchatbot')\gexec

-- Connect to the healthchatbot database
\c healthchatbot;

-- Create a dedicated user for the application (optional)
-- CREATE USER healthchatbot_user WITH PASSWORD 'app_password';
-- GRANT ALL PRIVILEGES ON DATABASE healthchatbot TO healthchatbot_user;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create a simple test table to verify the setup
CREATE TABLE IF NOT EXISTS db_setup_check (
    id SERIAL PRIMARY KEY,
    setup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT DEFAULT 'Database setup completed successfully'
);

-- Insert a test record
INSERT INTO db_setup_check (message) VALUES ('HealthChatbot database initialized') 
ON CONFLICT DO NOTHING;


