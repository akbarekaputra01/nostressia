import random
import string

def generate_otp(length=6) -> str:
    """
    Menghasilkan kode OTP angka acak.
    Default panjang: 6 digit.
    """
    # Mengambil angka '0'-'9' dan mengacaknya sebanyak 'length'
    return "".join(random.choices(string.digits, k=length))