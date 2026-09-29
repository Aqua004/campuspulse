from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..schemas import AuthUserOut, LoginRequest, RegisterStudentRequest, TokenResponse
from ..security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthUserOut, status_code=status.HTTP_201_CREATED)
def register_student(payload: RegisterStudentRequest, database: Session = Depends(get_db)):
    if crud.get_user_by_email(database, str(payload.email).lower()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = crud.register_student(database, payload)
    return AuthUserOut(full_name=user.full_name, email=user.email, role=user.role)


def _login(payload: LoginRequest, expected_role: str, database: Session) -> TokenResponse:
    user = crud.authenticate_user(database, str(payload.email), payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if user.role != expected_role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    token = create_access_token(user)
    return TokenResponse(access_token=token, user=AuthUserOut(full_name=user.full_name, email=user.email, role=user.role))


@router.post("/login/student", response_model=TokenResponse)
def login_student(payload: LoginRequest, database: Session = Depends(get_db)):
    return _login(payload, "student", database)


@router.post("/login/admin", response_model=TokenResponse)
def login_admin(payload: LoginRequest, database: Session = Depends(get_db)):
    return _login(payload, "admin", database)
