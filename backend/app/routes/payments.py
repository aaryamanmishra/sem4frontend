from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    TransferRequest,
    TransactionResponse,
    BeneficiaryCreate,
    BeneficiaryResponse,
    User,
)
from app.middleware.auth import get_current_user
from app.services.payment import validate_transfer, process_transfer

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/transfer", response_model=TransactionResponse)
def transfer(
    request: TransferRequest,
    sender: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recipient = validate_transfer(sender, request.recipient_phone, request.amount, db)
    transaction = process_transfer(
        sender, recipient, request.amount, request.description or "", db
    )
    return transaction


@router.get("/history")
def get_transaction_history(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    from app.models import Transaction

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user.user_id)
        .order_by(Transaction.timestamp.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "transaction_id": t.transaction_id,
            "amount": t.amount,
            "type": t.type,
            "status": t.status,
            "recipient_phone": t.recipient_phone,
            "description": t.description,
            "timestamp": t.timestamp,
        }
        for t in transactions
    ]


@router.post("/validate")
def validate_payment(
    request: TransferRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        recipient = validate_transfer(user, request.recipient_phone, request.amount, db)
        return {
            "valid": True,
            "recipient_name": recipient.name,
            "recipient_phone": recipient.phone,
        }
    except HTTPException as e:
        return {"valid": False, "error": e.detail}


@router.post("/beneficiaries", response_model=BeneficiaryResponse)
def add_beneficiary(
    beneficiary_data: BeneficiaryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models import Beneficiary

    new_beneficiary = Beneficiary(
        user_id=user.user_id,
        name=beneficiary_data.name,
        phone=beneficiary_data.phone,
        account_type=beneficiary_data.account_type,
        upi_id=beneficiary_data.upi_id,
    )

    db.add(new_beneficiary)
    db.commit()
    db.refresh(new_beneficiary)

    return new_beneficiary


@router.get("/beneficiaries", response_model=list[BeneficiaryResponse])
def get_beneficiaries(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    from app.models import Beneficiary

    beneficiaries = (
        db.query(Beneficiary).filter(Beneficiary.user_id == user.user_id).all()
    )

    return beneficiaries
