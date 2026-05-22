from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models import User, Transaction, Beneficiary
from app.config import get_settings
from datetime import datetime

settings = get_settings()


def validate_transfer(
    sender: User, recipient_phone: str, amount: float, db: Session
) -> User:
    if amount > settings.MAX_TRANSACTION_AMOUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount exceeds maximum limit of ₹{settings.MAX_TRANSACTION_AMOUNT}",
        )

    if sender.balance < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance"
        )

    recipient = db.query(User).filter(User.phone == recipient_phone).first()
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found"
        )

    if recipient.user_id == sender.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer to yourself",
        )

    daily_spent = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == sender.user_id,
            Transaction.type == "TRANSFER",
            Transaction.status == "COMPLETED",
            Transaction.timestamp
            >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
        )
        .with_entities(func.sum(Transaction.amount))
        .scalar()
        or 0
    )

    if daily_spent + amount > settings.MAX_DAILY_TRANSACTION_AMOUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Daily limit exceeded. Remaining: ₹{settings.MAX_DAILY_TRANSACTION_AMOUNT - daily_spent}",
        )

    return recipient


def process_transfer(
    sender: User,
    recipient: User,
    amount: float,
    description: str,
    db: Session,
) -> Transaction:
    balance_before = sender.balance

    sender.balance -= amount
    recipient.balance += amount

    transaction = Transaction(
        user_id=sender.user_id,
        amount=amount,
        type="TRANSFER",
        status="COMPLETED",
        balance_before=balance_before,
        balance_after=sender.balance,
        channel="UPI",
        recipient_user_id=recipient.user_id,
        recipient_phone=recipient.phone,
        description=description,
        timestamp=datetime.utcnow(),
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return transaction
