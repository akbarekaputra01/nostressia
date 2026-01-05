from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer 

from app.core.database import get_db
from app.models.user_model import User
from app.schemas.user_auth_schema import UserRegister, UserLogin, Token, UserResponse
from app.services import user_auth_service
from app.utils.jwt_handler import create_access_token, decode_access_token 

router = APIRouter(prefix="/user", tags=["User Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="user/login")

# --- DEPENDENCY ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    return user

# --- ENDPOINTS ---

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    return user_auth_service.create_user(db, user_in)

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = user_auth_service.authenticate_user(db, user_in.email, user_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau Password salah",
        )
    
    # ✅ Payload Token: Pakai userName juga biar konsisten
    access_token = create_access_token(
        data={
            "sub": user.email,
            "id": user.userID,
            "userName": user.userName # Key di token jadi 'userName'
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user