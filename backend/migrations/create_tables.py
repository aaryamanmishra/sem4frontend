"""
Database Migration Script
Run this to create new tables: beneficiaries, virtual_cards, bill_payments
"""
import psycopg
import os
from dotenv import load_dotenv

load_dotenv("/Users/aaryamanmishra/Documents/bankui/backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

CREATE_TABLES = """
-- Create beneficiaries table if not exists
CREATE TABLE IF NOT EXISTS beneficiaries (
    beneficiary_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    account_type VARCHAR DEFAULT 'UPI',
    upi_id VARCHAR,
    bank_account VARCHAR,
    ifsc_code VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create virtual_cards table if not exists
CREATE TABLE IF NOT EXISTS virtual_cards (
    card_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    card_number VARCHAR UNIQUE NOT NULL,
    card_type VARCHAR,
    status VARCHAR DEFAULT 'ACTIVE',
    expiry_date TIMESTAMP,
    cvv VARCHAR,
    daily_limit DOUBLE PRECISION DEFAULT 50000.00,
    total_limit DOUBLE PRECISION DEFAULT 500000.00,
    spent_today DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bill_payments table if not exists
CREATE TABLE IF NOT EXISTS bill_payments (
    bill_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    biller_name VARCHAR NOT NULL,
    bill_category VARCHAR NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    due_date TIMESTAMP,
    payment_date TIMESTAMP,
    status VARCHAR DEFAULT 'PENDING',
    bill_reference VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create wallet table if not exists
CREATE TABLE IF NOT EXISTS wallet (
    wallet_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    wallet_balance DOUBLE PRECISION DEFAULT 0.0,
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add password_hash column to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_timestamp ON transactions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user ON beneficiaries(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_user ON virtual_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_user ON bill_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
"""

try:
    with psycopg.connect(DATABASE_URL) as conn:
        cursor = conn.cursor()

        for statement in CREATE_TABLES.split(";"):
            if statement.strip():
                try:
                    cursor.execute(statement)
                    print(f"✓ Executed: {statement[:50]}...")
                except Exception as e:
                    print(f"⚠ Error: {e}")

        conn.commit()
        print("\n✅ Database migration completed successfully!")

except Exception as e:
    print(f"❌ Connection error: {e}")
