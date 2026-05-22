from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import psycopg2

app = FastAPI()

MAX_TRANSACTION_AMOUNT = 100000
MAX_DAILY_TRANSACTION_AMOUNT = 500000

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_URL = os.getenv("DATABASE_URL")

def get_conn():
    if not DB_URL:
        raise RuntimeError("DATABASE_URL environment variable is required")
    return psycopg2.connect(DB_URL, sslmode='require')


# 🏠 Home
@app.get("/")
def home():
    return {"status": "Bank API Running"}


# 🏗️ INIT DB (FINAL STRUCTURE)
@app.get("/init-db")
def init_db():
    conn = get_conn()
    cur = conn.cursor()

    # USERS TABLE (FULL KYC)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        name TEXT,
        phone TEXT UNIQUE,
        email TEXT UNIQUE,
        pan TEXT UNIQUE,
        aadhar TEXT UNIQUE,
        balance FLOAT DEFAULT 0,
        kyc BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # MIGRATE EXISTING USERS TABLES CREATED BY OLDER VERSIONS
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS pan TEXT UNIQUE;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS aadhar TEXT UNIQUE;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS balance FLOAT DEFAULT 0;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc BOOLEAN DEFAULT FALSE;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")

    # AUTO KYC RULE
    cur.execute("""
    CREATE OR REPLACE FUNCTION update_kyc()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.phone IS NOT NULL AND
           NEW.email IS NOT NULL AND
           NEW.pan IS NOT NULL AND
           NEW.aadhar IS NOT NULL THEN
            NEW.kyc = TRUE;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    cur.execute("""
    DROP TRIGGER IF EXISTS kyc_trigger ON users;
    CREATE TRIGGER kyc_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_kyc();
    """)

    # TRANSACTIONS TABLE (FULL TRACKING)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        txn_id SERIAL PRIMARY KEY,
        sender_id INT,
        receiver_id INT,
        amount FLOAT,
        status TEXT,
        sender_balance_before FLOAT,
        sender_balance_after FLOAT,
        receiver_balance_before FLOAT,
        receiver_balance_after FLOAT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # MIGRATE EXISTING TRANSACTIONS TABLES CREATED BY OLDER VERSIONS
    cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS txn_id SERIAL;")
    cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_id INT;")
    cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receiver_id INT;")
    cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount FLOAT;")
    cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT;")
    cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_balance_before FLOAT;")
    cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_balance_after FLOAT;")
    cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receiver_balance_before FLOAT;")
    cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receiver_balance_after FLOAT;")
    cur.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")
    cur.execute("ALTER TABLE transactions ALTER COLUMN timestamp SET DEFAULT CURRENT_TIMESTAMP;")
    cur.execute("UPDATE transactions SET timestamp = CURRENT_TIMESTAMP WHERE timestamp IS NULL;")
    cur.execute("""
        WITH duplicate_timestamps AS (
            SELECT
                txn_id,
                ROW_NUMBER() OVER (PARTITION BY timestamp ORDER BY txn_id) AS duplicate_index
            FROM transactions
            WHERE timestamp IS NOT NULL
        )
        UPDATE transactions AS t
        SET timestamp = t.timestamp + ((d.duplicate_index - 1) * INTERVAL '1 minute')
        FROM duplicate_timestamps AS d
        WHERE t.txn_id = d.txn_id
          AND d.duplicate_index > 1;
    """)

    conn.commit()
    cur.close()
    conn.close()

    return {"status": "DB fully initialized"}
    

# 👤 ADD USER (FULL KYC SUPPORT)
@app.get("/add-user")
def add_user(
    name: str,
    balance: float = 0,
    phone: str = None,
    email: str = None,
    pan: str = None,
    aadhar: str = None
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute("""
            INSERT INTO users (name, balance, phone, email, pan, aadhar)
            VALUES (%s,%s,%s,%s,%s,%s)
            RETURNING user_id, kyc
        """, (name, balance, phone, email, pan, aadhar))

        user = cur.fetchone()
        conn.commit()

        return {
            "status": "User added",
            "user_id": user[0],
            "kyc_verified": user[1]
        }

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}

    finally:
        cur.close()
        conn.close()


# 👤 GET ALL USERS
@app.get("/users")
def get_users():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT user_id, name, phone, email, pan, aadhar, balance, kyc, created_at
        FROM users
        ORDER BY user_id
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return {"users": [
        {
            "user_id": r[0], "name": r[1], "phone": r[2],
            "email": r[3], "pan": r[4], "aadhar": r[5],
            "balance": r[6], "kyc": r[7], "created_at": str(r[8])
        } for r in rows
    ]}


# 🔐 CUSTOMER LOGIN
@app.get("/login")
def login(user_id: int, pan: str):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT user_id, name, phone, email, pan, aadhar, balance, kyc, created_at
        FROM users
        WHERE user_id=%s AND UPPER(pan)=UPPER(%s)
    """, (user_id, pan.strip()))
    result = cur.fetchone()

    cur.close()
    conn.close()

    if not result:
        return {"error": "Invalid customer ID or PAN"}

    return {
        "user": {
            "user_id": result[0],
            "name": result[1],
            "phone": result[2],
            "email": result[3],
            "pan": result[4],
            "aadhar": result[5],
            "balance": result[6],
            "kyc": result[7],
            "created_at": str(result[8])
        }
    }


# 💰 BALANCE
@app.get("/balance")
def get_balance(user_id: int):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT balance FROM users WHERE user_id=%s", (user_id,))
    result = cur.fetchone()

    cur.close()
    conn.close()

    if not result:
        return {"error": "User not found"}

    return {"balance": result[0]}


# 🔁 TRANSFER (FINAL VERSION)
@app.get("/transfer")
def transfer(sender_id: int, receiver_id: int, amount: float):
    conn = get_conn()
    cur = conn.cursor()

    try:
        if amount <= 0:
            return {"error": "Amount must be greater than 0"}

        if sender_id == receiver_id:
            return {"error": "Cannot transfer to yourself"}

        if amount > MAX_TRANSACTION_AMOUNT:
            return {"error": "Single transaction limit is ₹1,00,000"}

        cur.execute("""
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions
            WHERE sender_id=%s
              AND status='SUCCESS'
              AND timestamp >= CURRENT_DATE
              AND timestamp < CURRENT_DATE + INTERVAL '1 day'
        """, (sender_id,))
        daily_spent = cur.fetchone()[0] or 0

        if daily_spent + amount > MAX_DAILY_TRANSACTION_AMOUNT:
            remaining = max(MAX_DAILY_TRANSACTION_AMOUNT - daily_spent, 0)
            return {"error": f"Daily transfer limit exceeded. Remaining limit is ₹{remaining:,.2f}"}

        # Sender
        cur.execute("SELECT balance FROM users WHERE user_id=%s FOR UPDATE", (sender_id,))
        sender = cur.fetchone()

        if not sender:
            return {"error": "Sender not found"}

        sender_before = sender[0]

        if sender_before < amount:
            return {"error": "Insufficient balance"}

        # Receiver
        cur.execute("SELECT balance FROM users WHERE user_id=%s FOR UPDATE", (receiver_id,))
        receiver = cur.fetchone()

        if not receiver:
            return {"error": "Receiver not found"}

        receiver_before = receiver[0]

        # Compute
        sender_after = sender_before - amount
        receiver_after = receiver_before + amount

        # Update balances
        cur.execute("UPDATE users SET balance=%s WHERE user_id=%s",
                    (sender_after, sender_id))

        cur.execute("UPDATE users SET balance=%s WHERE user_id=%s",
                    (receiver_after, receiver_id))

        # Log
        cur.execute("""
        INSERT INTO transactions (
            sender_id, receiver_id, amount, status,
            sender_balance_before, sender_balance_after,
            receiver_balance_before, receiver_balance_after,
            timestamp
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,CURRENT_TIMESTAMP)
        RETURNING txn_id, timestamp
        """, (
            sender_id, receiver_id, amount, "SUCCESS",
            sender_before, sender_after,
            receiver_before, receiver_after
        ))
        txn = cur.fetchone()

        conn.commit()

        return {
            "status": "success",
            "txn_id": txn[0],
            "timestamp": txn[1].isoformat() if txn[1] else None,
            "sender_balance": sender_after,
            "receiver_balance": receiver_after
        }

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}

    finally:
        cur.close()
        conn.close()


# 📜 TRANSACTIONS
@app.get("/transactions")
def get_transactions():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT txn_id, sender_id, receiver_id, amount, status,
               sender_balance_before, sender_balance_after,
               receiver_balance_before, receiver_balance_after,
               timestamp
        FROM transactions
        ORDER BY timestamp DESC
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return {"transactions": [
        {
            "txn_id": r[0], "sender_id": r[1], "receiver_id": r[2],
            "amount": r[3], "status": r[4],
            "sender_balance_before": r[5], "sender_balance_after": r[6],
            "receiver_balance_before": r[7], "receiver_balance_after": r[8],
            "timestamp": r[9].isoformat() if r[9] else None
        } for r in rows
    ]}
