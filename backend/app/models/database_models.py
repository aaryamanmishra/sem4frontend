from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, nullable=True)
    balance = Column(Float, default=0.0)
    password_hash = Column(String, nullable=True)
    aadhar = Column(String, nullable=True)
    pan = Column(String, nullable=True)
    kyc_verified = Column(Boolean, default=False)
    account_type = Column(String, default="SAVINGS")
    created_at = Column(DateTime, default=datetime.utcnow, server_default=func.now())

    transactions = relationship("Transaction", back_populates="user")
    beneficiaries = relationship("Beneficiary", back_populates="user")
    cards = relationship("VirtualCard", back_populates="user")
    bills = relationship("BillPayment", back_populates="user")


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    amount = Column(Float)
    type = Column(String)  # TRANSFER, REQUEST, BILL_PAYMENT
    status = Column(String, default="COMPLETED")  # PENDING, COMPLETED, FAILED
    balance_before = Column(Float)
    balance_after = Column(Float)
    channel = Column(String)  # UPI, CARD, WALLET
    merchant_category = Column(String, nullable=True)
    recipient_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    recipient_phone = Column(String, nullable=True)
    description = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, server_default=func.now(), index=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="transactions")


class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    beneficiary_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    name = Column(String)
    phone = Column(String)
    account_type = Column(String)  # UPI, BANK_ACCOUNT, WALLET
    upi_id = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    ifsc_code = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="beneficiaries")


class VirtualCard(Base):
    __tablename__ = "virtual_cards"

    card_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    card_number = Column(String, unique=True)
    card_type = Column(String)  # DEBIT, CREDIT, PREPAID
    status = Column(String, default="ACTIVE")  # ACTIVE, BLOCKED, EXPIRED
    expiry_date = Column(DateTime)
    cvv = Column(String)
    daily_limit = Column(Float, default=50000.00)
    total_limit = Column(Float, default=500000.00)
    spent_today = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="cards")


class BillPayment(Base):
    __tablename__ = "bill_payments"

    bill_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), index=True)
    biller_name = Column(String)
    bill_category = Column(String)  # ELECTRICITY, WATER, INTERNET, MOBILE
    amount = Column(Float)
    due_date = Column(DateTime)
    payment_date = Column(DateTime, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, PAID, OVERDUE
    bill_reference = Column(String, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bills")


class CreditAccount(Base):
    __tablename__ = "credit_accounts"

    credit_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    credit_limit = Column(Float)
    current_outstanding = Column(Float, default=0.0)
    interest_rate = Column(Float, default=0.0)
    status = Column(String, default="ACTIVE")
    timestamp = Column(DateTime, default=datetime.utcnow)


class Repayment(Base):
    __tablename__ = "repayments"

    repayment_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    credit_id = Column(Integer, ForeignKey("credit_accounts.credit_id"))
    due_amount = Column(Float)
    paid_amount = Column(Float, default=0.0)
    due_date = Column(DateTime)
    payment_date = Column(DateTime, nullable=True)
    delay_days = Column(Integer, default=0)
    status = Column(String, default="PENDING")
    timestamp = Column(DateTime, default=datetime.utcnow)
