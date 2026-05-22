from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str = Field(..., min_length=6)
    aadhar: Optional[str] = None
    pan: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: str
    phone: str
    balance: float
    kyc_verified: bool
    account_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class TransferRequest(BaseModel):
    recipient_phone: str
    amount: float = Field(..., gt=0, le=100000)
    description: Optional[str] = None


class TransactionResponse(BaseModel):
    transaction_id: int
    amount: float
    type: str
    status: str
    balance_before: float
    balance_after: float
    recipient_phone: Optional[str]
    description: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class BeneficiaryCreate(BaseModel):
    name: str
    phone: str
    account_type: str = "UPI"
    upi_id: Optional[str] = None


class BeneficiaryResponse(BaseModel):
    beneficiary_id: int
    name: str
    phone: str
    account_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class VirtualCardResponse(BaseModel):
    card_id: int
    card_number: str
    card_type: str
    status: str
    daily_limit: float
    spent_today: float

    class Config:
        from_attributes = True


class BillPaymentCreate(BaseModel):
    biller_name: str
    bill_category: str
    amount: float
    bill_reference: str
    due_date: Optional[datetime] = None


class BillPaymentResponse(BaseModel):
    bill_id: int
    biller_name: str
    bill_category: str
    amount: float
    status: str
    payment_date: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ErrorResponse(BaseModel):
    error: str
    code: str
    details: Optional[str] = None
