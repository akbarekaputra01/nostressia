import random
import string

def generate_otp(length=6) -> str:
    """
    Generate a numeric OTP code.
    Default panjang: 6 digit.
    """
    # Sample digits '0'-'9' and shuffle for the requested length.
    return "".join(random.choices(string.digits, k=length))
