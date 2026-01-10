from datetime import date, timedelta # ✅ PENTING: Import untuk logika Streak
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer 

from app.core.database import get_db
from app.models.user_model import User
from app.services import user_auth_service
from app.utils.jwt_handler import create_access_token, decode_access_token 

# ✅ Import Schema lengkap
from app.schemas.user_auth_schema import (
    UserRegister, 
    UserLogin, 
    Token, 
    UserResponse, 
    UserUpdate,
    ChangePasswordSchema 
)

# ✅ Import Utils Hashing
from app.utils.hashing import verify_password, hash_password 

router = APIRouter(prefix="/user", tags=["User Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="user/login")

# --- DEPENDENCY: Get Current User ---
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
    # 1. Autentikasi User
    user = user_auth_service.authenticate_user(db, user_in.email, user_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau Password salah",
        )
    
    # --- ✅ LOGIKA HITUNG STREAK (BARU) ---
    today = date.today()
    last_login = user.lastLogin

    if last_login == today:
        # User login lagi di hari yang sama -> Streak tetap
        pass
    elif last_login == today - timedelta(days=1):
        # User login kemarin, dan sekarang login lagi -> Streak Nambah
        # (user.streak or 0) menangani jika streak awalnya NULL/None
        user.streak = (user.streak or 0) + 1
    else:
        # User loginnya sudah lama (bolong) atau baru pertama kali -> Reset ke 1
        user.streak = 1
        
    # Update tanggal login terakhir ke hari ini
    user.lastLogin = today
    db.commit()
    # ---------------------------------------
    
    # 2. Generate Token
    access_token = create_access_token(
        data={
            "sub": user.email,
            "id": user.userID,
            "userName": user.userName 
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_profile(
    user_update: UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Cek Unik UserName (Jika user ingin mengganti username)
    if user_update.userName is not None and user_update.userName != current_user.userName:
        existing_username = db.query(User).filter(User.userName == user_update.userName).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.userName = user_update.userName

    # 2. Cek Unik Email (Jika user ingin mengganti email)
    if user_update.email is not None and user_update.email != current_user.email:
        existing_email = db.query(User).filter(User.email == user_update.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email

    # 3. Update field lainnya jika ada
    if user_update.name is not None:
        current_user.name = user_update.name
    
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar
        
    if user_update.gender is not None:
        current_user.gender = user_update.gender

    # 4. Simpan ke Database
    db.commit()
    db.refresh(current_user)
    
    return current_user

# ✅ ENDPOINT CHANGE PASSWORD (YANG TADI KITA BUAT)
@router.put("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordSchema, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # 1. Verifikasi Password Lama
    if not verify_password(payload.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Password lama salah"
        )
    
    # 2. Cek apakah password baru sama dengan password lama
    if verify_password(payload.new_password, current_user.password):
        raise HTTPException(
             status_code=status.HTTP_400_BAD_REQUEST,
             detail="Password baru tidak boleh sama dengan password lama"
        )

    # 3. Hash Password Baru
    hashed_new_password = hash_password(payload.new_password)
    
    # 4. Update ke Database
    current_user.password = hashed_new_password
    db.commit()
    
    return {"message": "Password updated successfully"}