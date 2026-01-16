# app/services/email_service.py
import os
from dotenv import load_dotenv
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

# 1. Load Environment Variables
load_dotenv()

# 2. Ambil API Key dari file .env
BREVO_API_KEY = os.getenv("BREVO_API_KEY")

# ⚠️ Ganti dengan email yang kamu gunakan untuk login Brevo
SENDER_EMAIL = "kaleblister36@gmail.com" 

def send_otp_email(to_email: str, otp_code: str):
    """
    Fungsi untuk mengirim email OTP Pendaftaran (Register).
    """
    # Konfigurasi API
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    # Setup Pengirim (Harus Verified Email)
    sender = {"name": "Nostressia Admin", "email": SENDER_EMAIL}
    to = [{"email": to_email}]
    
    # HTML Body untuk Register
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <div style="max-width: 500px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #4F46E5;">Verifikasi Akun Nostressia</h2>
            <p>Halo,</p>
            <p>Terima kasih telah mendaftar. Gunakan kode OTP berikut untuk memverifikasi akun Anda:</p>
            <h1 style="color: #333; letter-spacing: 5px; background-color: #f3f4f6; padding: 10px; border-radius: 5px; display: inline-block;">
                {otp_code}
            </h1>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">
                Kode ini berlaku selama 10 menit.<br>
                Jika Anda tidak merasa mendaftar, abaikan email ini.
            </p>
        </div>
      </body>
    </html>
    """

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        sender=sender,
        subject="Kode OTP Nostressia Anda",
        html_content=html_content
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        print(f"✅ Email Register terkirim ke {to_email}")
        return True
    except ApiException as e:
        print(f"❌ Gagal mengirim email Register: {e}")
        return False


def send_reset_password_email(to_email: str, otp_code: str):
    """
    Fungsi untuk mengirim email OTP Reset Password.
    """
    # Konfigurasi API
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    # Setup Pengirim
    sender = {"name": "Nostressia Support", "email": SENDER_EMAIL}
    to = [{"email": to_email}]
    
    # HTML Body untuk Reset Password (Warna Merah/Warning)
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <div style="max-width: 500px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #DC2626;">Reset Password</h2>
            <p>Seseorang (semoga Anda) meminta reset password untuk akun Nostressia.</p>
            <p>Gunakan kode OTP berikut untuk membuat password baru:</p>
            <h1 style="color: #333; letter-spacing: 5px; background-color: #fee2e2; padding: 10px; border-radius: 5px; display: inline-block;">
                {otp_code}
            </h1>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">
                Jika ini bukan Anda, abaikan email ini. Akun Anda tetap aman.
            </p>
        </div>
      </body>
    </html>
    """

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        sender=sender,
        subject="Reset Password Nostressia",
        html_content=html_content
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        print(f"✅ Email Reset Password terkirim ke {to_email}")
        return True
    except ApiException as e:
        print(f"❌ Gagal mengirim email Reset Password: {e}")
        return False