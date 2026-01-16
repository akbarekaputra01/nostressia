# app/routes/user_auth_route.py

from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer 

from app.core.database import get_db
from app.models.user_model import User
from app.utils.jwt_handler import create_access_token, decode_access_token 

# ✅ Import Utils Baru
from app.utils.hashing import verify_password, hash_password 
from app.utils.otp_generator import generate_otp       
from app.services.email_service import send_otp_email
from app.services.email_service import send_otp_email, send_reset_password_email

# ✅ Import Schema
from app.schemas.user_auth_schema import (
    UserRegister, 
    UserLogin, 
    Token, 
    UserResponse, 
    UserUpdate,
    ChangePasswordSchema,
    VerifyOTP,
    ForgotPasswordRequest,
    ResetPasswordConfirm
)

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

# 1. REGISTER (Updated with OTP)
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # A. Cek Email & Username Kembar
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if db.query(User).filter(User.userName == user_in.userName).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # B. Generate OTP & Hash Password
    otp_code = generate_otp(6)
    hashed_pw = hash_password(user_in.password)

    # C. Buat User Baru (Status Verified = False)
    new_user = User(
        name=user_in.name,
        userName=user_in.userName,
        email=user_in.email,
        password=hashed_pw,
        gender=user_in.gender,
        userDOB=user_in.dob, 
        avatar=user_in.avatar,
        
        # Field OTP
        otp_code=otp_code,
        is_verified=False,
        streak=0
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # D. Kirim Email
    email_sent = send_otp_email(new_user.email, otp_code)
    
    if not email_sent:
        print("⚠️ Gagal mengirim email OTP ke:", new_user.email)

    # E. Return Pesan (Bukan Token)
    return {
        "message": "Registration successful! Please check your email for OTP verification.",
        "email": new_user.email
    }

# 2. VERIFY OTP (Endpoint Baru)
@router.post("/verify-otp", status_code=status.HTTP_200_OK)
def verify_otp_endpoint(payload: VerifyOTP, db: Session = Depends(get_db)):
    # Cari user berdasarkan email
    user = db.query(User).filter(User.email == payload.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Cek apakah sudah verified
    if user.is_verified:
        return {"message": "Account already verified. Please login."}

    # Cek kode OTP
    if user.otp_code != payload.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    # Jika cocok: Aktifkan akun
    user.is_verified = True
    user.otp_code = None # Hapus OTP biar aman
    db.commit()

    return {"message": "Account verified successfully! You can now login."}

# 3. LOGIN (Updated: Support Email OR Username)
@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    
    # ✅ LOGIKA BARU: Cek apakah inputnya Email atau Username
    user = None
    
    # Jika input mengandung '@', kita anggap itu Email
    if "@" in user_in.identifier:
        user = db.query(User).filter(User.email == user_in.identifier).first()
    else:
        # Jika tidak ada '@', kita anggap itu Username
        user = db.query(User).filter(User.userName == user_in.identifier).first()
    
    # Cek Password
    if not user or not verify_password(user_in.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username/Email atau Password salah",
        )
    
    # ✅ CEK VERIFIKASI SEBELUM LOGIN
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun belum diverifikasi. Silakan cek email Anda atau lakukan verifikasi OTP.",
        )
    
    # --- LOGIKA STREAK ---
    today = date.today()
    last_login = user.lastLogin 

    if last_login == today:
        pass
    elif last_login == today - timedelta(days=1):
        user.streak = (user.streak or 0) + 1
    else:
        user.streak = 1
        
    user.lastLogin = today
    db.commit()
    # ---------------------
    
    # Generate Token
    # Kita tetap pakai user.email untuk 'sub' agar konsisten dengan dependency get_current_user
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
    if user_update.userName is not None and user_update.userName != current_user.userName:
        if db.query(User).filter(User.userName == user_update.userName).first():
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.userName = user_update.userName

    if user_update.email is not None and user_update.email != current_user.email:
        if db.query(User).filter(User.email == user_update.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email

    if user_update.name is not None: current_user.name = user_update.name
    if user_update.avatar is not None: current_user.avatar = user_update.avatar
    if user_update.gender is not None: current_user.gender = user_update.gender

    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordSchema, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if not verify_password(payload.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Password lama salah")
    
    if verify_password(payload.new_password, current_user.password):
        raise HTTPException(status_code=400, detail="Password baru tidak boleh sama dengan password lama")

    current_user.password = hash_password(payload.new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # 1. Cek Email ada atau tidak
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Demi keamanan, biasanya kita bilang "Jika email ada, OTP dikirim"
        # Tapi untuk development, kita raise error aja biar jelas
        raise HTTPException(status_code=404, detail="Email tidak terdaftar")

    # 2. Generate OTP Baru
    otp_code = generate_otp(6)
    
    # 3. Simpan OTP ke User (Kita tumpuk OTP lama, tidak masalah)
    user.otp_code = otp_code
    db.commit()

    # 4. Kirim Email
    email_sent = send_reset_password_email(user.email, otp_code)
    
    if not email_sent:
        raise HTTPException(status_code=500, detail="Gagal mengirim email. Coba lagi nanti.")

    return {"message": "Kode OTP reset password telah dikirim ke email Anda."}


@router.post("/reset-password-confirm", status_code=status.HTTP_200_OK)
def reset_password_confirm(payload: ResetPasswordConfirm, db: Session = Depends(get_db)):
    # 1. Cari User
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    # 2. Cek OTP
    if user.otp_code != payload.otp_code:
        raise HTTPException(status_code=400, detail="Kode OTP salah atau kadaluarsa")

    # 3. Ganti Password
    user.password = hash_password(payload.new_password)
    
    # 4. Hapus OTP (Biar gak bisa dipakai 2x) & Pastikan Verified
    user.otp_code = None
    user.is_verified = True # Sekalian verifikasi akun kalau belum
    
    db.commit()

    return {"message": "Password berhasil diubah! Silakan login dengan password baru."}