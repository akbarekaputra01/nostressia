"""Email delivery utilities for OTP and weekly reports."""
import logging
import os
from typing import Optional, Tuple

from dotenv import load_dotenv
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

# Load environment variables.
load_dotenv()

# Read the API key from the environment.
BREVO_API_KEY = os.getenv("BREVO_API_KEY")

logger = logging.getLogger(__name__)

# Sender email used for Brevo.
SENDER_EMAIL = "nostressia.official@gmail.com"

def _get_brevo_client() -> Tuple[Optional[sib_api_v3_sdk.TransactionalEmailsApi], Optional[str]]:
    if not BREVO_API_KEY:
        return None, "BREVO_API_KEY is not set in the environment."

    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key["api-key"] = BREVO_API_KEY
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
        sib_api_v3_sdk.ApiClient(configuration)
    )
    return api_instance, None


def send_otp_email(to_email: str, otp_code: str) -> Tuple[bool, Optional[str]]:
    """Send the registration OTP email."""
    api_instance, error_message = _get_brevo_client()
    if error_message:
        logger.error("Email client error: %s", error_message)
        return False, error_message
    
    # Sender configuration (must be a verified email).
    sender = {"name": "Nostressia Admin", "email": SENDER_EMAIL}
    to = [{"email": to_email}]
    
    # Registration email HTML body.
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <div style="max-width: 500px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #4F46E5;">Verify Your Nostressia Account</h2>
            <p>Hello,</p>
            <p>Thank you for signing up. Use the OTP below to verify your account:</p>
            <h1 style="color: #333; letter-spacing: 5px; background-color: #f3f4f6; padding: 10px; border-radius: 5px; display: inline-block;">
                {otp_code}
            </h1>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">
                This code is valid for 10 minutes.<br>
                If you did not sign up, you can ignore this email.
            </p>
        </div>
      </body>
    </html>
    """

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        sender=sender,
        subject="Your Nostressia OTP Code",
        html_content=html_content
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        logger.info("Registration email sent to %s", to_email)
        return True, None
    except ApiException as e:
        error_detail = f"Brevo API error: {e}"
        logger.error("Failed to send registration email: %s", error_detail)
        return False, error_detail
    except Exception as e:
        error_detail = f"Unexpected error: {e}"
        logger.error("Failed to send registration email: %s", error_detail)
        return False, error_detail


def send_reset_password_email(to_email: str, otp_code: str) -> Tuple[bool, Optional[str]]:
    """Send the password reset OTP email."""
    api_instance, error_message = _get_brevo_client()
    if error_message:
        logger.error("Email client error: %s", error_message)
        return False, error_message
    
    # Sender configuration.
    sender = {"name": "Nostressia Support", "email": SENDER_EMAIL}
    to = [{"email": to_email}]
    
    # Password reset email HTML body.
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <div style="max-width: 500px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #DC2626;">Password Reset</h2>
            <p>Someone requested a password reset for your Nostressia account.</p>
            <p>Use the OTP below to create a new password:</p>
            <h1 style="color: #333; letter-spacing: 5px; background-color: #fee2e2; padding: 10px; border-radius: 5px; display: inline-block;">
                {otp_code}
            </h1>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">
                If this was not you, you can ignore this email. Your account remains safe.
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
        logger.info("Password reset email sent to %s", to_email)
        return True, None
    except ApiException as e:
        error_detail = f"Brevo API error: {e}"
        logger.error("Failed to send password reset email: %s", error_detail)
        return False, error_detail
    except Exception as e:
        error_detail = f"Unexpected error: {e}"
        logger.error("Failed to send password reset email: %s", error_detail)
        return False, error_detail


def send_weekly_report_email(
    to_email: str,
    report: dict,
    user_name: str = "there",
) -> Tuple[bool, Optional[str]]:
    api_instance, error_message = _get_brevo_client()
    if error_message:
        logger.error("Email client error: %s", error_message)
        return False, error_message

    sender = {"name": "Nostressia", "email": SENDER_EMAIL}
    to = [{"email": to_email}]

    date_range = report.get("date_range", "the past week")
    stress_count = report.get("stress_logs", 0)
    diary_count = report.get("diary_entries", 0)
    avg_stress = report.get("avg_stress_level", "-")
    streak = report.get("streak", 0)

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <div style="max-width: 560px; margin: auto; border: 1px solid #e5e7eb; padding: 24px; border-radius: 14px;">
          <h2 style="color: #2563eb; margin-bottom: 8px;">Weekly Report</h2>
          <p style="color: #4b5563; margin-top: 0;">Hi {user_name}, here is your summary for {date_range}.</p>
          <div style="text-align: left; margin-top: 20px;">
            <p style="margin: 6px 0;"><strong>Stress logs:</strong> {stress_count}</p>
            <p style="margin: 6px 0;"><strong>Diary entries:</strong> {diary_count}</p>
            <p style="margin: 6px 0;"><strong>Average stress level:</strong> {avg_stress}</p>
            <p style="margin: 6px 0;"><strong>Current streak:</strong> {streak} days</p>
          </div>
          <p style="margin-top: 18px; font-size: 12px; color: #6b7280;">
            Keep checking in daily to unlock more insights.
          </p>
        </div>
      </body>
    </html>
    """

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        sender=sender,
        subject="Your Nostressia Weekly Report",
        html_content=html_content,
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        logger.info("Weekly report email sent to %s", to_email)
        return True, None
    except ApiException as e:
        error_detail = f"Brevo API error: {e}"
        logger.error("Failed to send weekly report email: %s", error_detail)
        return False, error_detail
    except Exception as e:
        error_detail = f"Unexpected error: {e}"
        logger.error("Failed to send weekly report email: %s", error_detail)
        return False, error_detail
