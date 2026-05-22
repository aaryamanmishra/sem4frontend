from fastapi import APIRouter, Depends
from app.models import User, UserResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/profile", response_model=UserResponse)
def get_profile(user: User = Depends(get_current_user)):
    return user


@router.get("/balance")
def get_balance(user: User = Depends(get_current_user)):
    return {"balance": user.balance, "currency": "INR"}
