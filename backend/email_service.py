"""
Email notification service
SMTP-only configuration
"""
import smtplib
import json
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from .email_models import EmailSettings, EmailLog


class EmailService:
    """Email notification service via SMTP"""
    
    def __init__(self, db: Session):
        self.db = db
        self.settings = self._get_settings()
    
    def _get_settings(self) -> Optional[EmailSettings]:
        """Fetch email settings"""
        return self.db.query(EmailSettings).first()
    
    def send_email(self, to_emails: List[str], subject: str, html_body: str, event_type: str) -> tuple[bool, str]:
        """Send an email notification via SMTP"""
        if not self.settings or not self.settings.notifications_enabled:
            return False, "Email notifications are disabled"
        
        try:
            # Dynamic sender name by event type
            if event_type == "registration":
                from_name = f"{self.settings.from_name} - User Registration"
            elif event_type == "completion":
                from_name = f"{self.settings.from_name} - Training Completed"
            elif event_type == "test":
                from_name = f"{self.settings.from_name} - Test Email"
            else:
                from_name = self.settings.from_name
            
            # Create MIME message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{self.settings.from_email}>"
            msg["To"] = ", ".join(to_emails)
            
            # Attach HTML body
            html_part = MIMEText(html_body, "html")
            msg.attach(html_part)
            
            # Connect to SMTP and send
            encryption = self.settings.encryption.lower() if self.settings.encryption else "tls"
            
            if encryption == "starttls":
                server = smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port, timeout=5)
                server.starttls()
            elif encryption == "ssl":
                server = smtplib.SMTP_SSL(self.settings.smtp_host, self.settings.smtp_port, timeout=5)
            else:  # tls by default
                server = smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port, timeout=5)
                server.starttls()
            
            server.login(self.settings.smtp_username, self.settings.smtp_password)
            server.sendmail(self.settings.from_email, to_emails, msg.as_string())
            server.quit()
            
            success, error_msg = True, None
            
        except smtplib.SMTPAuthenticationError as e:
            success, error_msg = False, f"Authentication failed: {str(e)}"
            print(f"SMTP send error: {error_msg}")
        except smtplib.SMTPConnectError as e:
            success, error_msg = False, f"Connection failed: Unable to connect to {self.settings.smtp_host}:{self.settings.smtp_port}"
            print(f"SMTP send error: {error_msg}")
        except smtplib.SMTPServerDisconnected as e:
            success, error_msg = False, f"Server disconnected unexpectedly: {str(e)}"
            print(f"SMTP send error: {error_msg}")
        except smtplib.SMTPRecipientsRefused as e:
            success, error_msg = False, f"Recipients refused: {str(e)}"
            print(f"SMTP send error: {error_msg}")
        except smtplib.SMTPException as e:
            success, error_msg = False, f"SMTP error: {str(e)}"
            print(f"SMTP send error: {error_msg}")
        except TimeoutError:
            success, error_msg = False, f"Connection timeout: Could not connect to {self.settings.smtp_host}:{self.settings.smtp_port}"
            print(f"SMTP send error: {error_msg}")
        except Exception as e:
            success, error_msg = False, f"Unexpected error: {type(e).__name__}: {str(e)}"
            print(f"SMTP send error: {error_msg}")
        
        # Log send attempt
        for email in to_emails:
            log = EmailLog(
                recipient=email,
                subject=subject,
                event_type=event_type,
                status="success" if success else "failed",
                error_message=None if success else error_msg
            )
            self.db.add(log)
        
        self.db.commit()
        return success, error_msg or "Email sent successfully"
    
    def send_registration_notification(self, user_email: str, user_name: str):
        """Send registration notification (to admins)"""
        if not self.settings or not self.settings.notify_on_registration:
            return
        
        # Get active admin recipients
        from .email_models import NotificationAdmin
        admins = self.db.query(NotificationAdmin).filter(
            NotificationAdmin.is_active == True,
            NotificationAdmin.receive_registration_notifications == True
        ).all()
        
        recipients = [admin.email for admin in admins]
        if not recipients:
            return
        
        subject = f"✅ New registration: {user_name}"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                    🎉 New user registered
                </h2>
                
                <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Name:</strong> {user_name}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> {user_email}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> {datetime.now().strftime("%Y-%m-%d %H:%M")}</p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    This is an automated notification from SnapCheck.
                </p>
            </div>
        </body>
        </html>
        """
        
        self.send_email(recipients, subject, html_body, "registration")
    
    def send_completion_notification(self, user_name: str, user_email: str, 
                                     presentation_title: str, completed_at: datetime):
        """Send presentation completion notification (to admins)"""
        if not self.settings or not self.settings.notify_on_completion:
            return
        
        # Get active admin recipients
        from .email_models import NotificationAdmin
        admins = self.db.query(NotificationAdmin).filter(
            NotificationAdmin.is_active == True,
            NotificationAdmin.receive_completion_notifications == True
        ).all()
        
        recipients = [admin.email for admin in admins]
        if not recipients:
            return
        
        subject = f"✅ Presentation completed: {presentation_title}"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
                    ✅ Presentation successfully completed
                </h2>
                
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>User:</strong> {user_name}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> {user_email}</p>
                    <p style="margin: 5px 0;"><strong>Presentation:</strong> {presentation_title}</p>
                    <p style="margin: 5px 0;"><strong>Completion date:</strong> {completed_at.strftime("%Y-%m-%d %H:%M")}</p>
                </div>
                
                <div style="background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; color: #1e40af;">
                        <strong>✓</strong> The user has reviewed all slides of the presentation.
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    This is an automated notification from SnapCheck.
                </p>
            </div>
        </body>
        </html>
        """
        
        self.send_email(recipients, subject, html_body, "completion")
    
    def send_test_email(self, test_recipient: str) -> tuple[bool, str]:
        """Send a test email"""
        subject = "🧪 Test email from SnapCheck"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
                    🧪 Test message
                </h2>
                
                <div style="background-color: #faf5ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;">✅ Email settings are working correctly!</p>
                    <p style="margin: 5px 0;"><strong>SMTP Host:</strong> {self.settings.smtp_host if self.settings else 'Not configured'}</p>
                    <p style="margin: 5px 0;"><strong>From Email:</strong> {self.settings.from_email if self.settings else 'Not configured'}</p>
                    <p style="margin: 5px 0;"><strong>Sent at:</strong> {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    This is a test notification from SnapCheck.
                </p>
            </div>
        </body>
        </html>
        """
        
        try:
            success, error_msg = self.send_email([test_recipient], subject, html_body, "test")
            if success:
                # Update last test time
                if self.settings:
                    self.settings.last_test_at = datetime.utcnow()
                    self.db.commit()
                return True, "Test email sent successfully"
            else:
                return False, error_msg or "Email sending error"
        except Exception as e:
            return False, str(e)
    
    def send_verification_email(self, user_email: str, user_name: str, verification_token: str):
        """Send email verification message to user"""
        # Получить базовый URL приложения
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        verification_link = f"{frontend_url}/verify-email?token={verification_token}"
        
        subject = "✅ Verify your email - Training System"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                    ✅ Email verification
                </h2>
                
                <p style="font-size: 16px;">Hello, {user_name}!</p>
                
                <p style="font-size: 14px; color: #555;">
                    Thank you for registering in Training System. To complete your registration, please verify your email address.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_link}" 
                       style="display: inline-block; padding: 15px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Verify Email
                    </a>
                </div>
                
                <p style="font-size: 13px; color: #666;">
                    If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="font-size: 12px; color: #999; word-break: break-all;">
                    {verification_link}
                </p>
                
                <p style="font-size: 13px; color: #999; margin-top: 30px;">
                    This link is valid for 24 hours.
                </p>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    If you did not register in our system, simply ignore this email.
                </p>
            </div>
        </body>
        </html>
        """
        
        self.send_email([user_email], subject, html_body, "verification")
    
    def send_password_reset_email(self, user_email: str, user_name: str, reset_token: str):
        """Send password reset email to user"""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        reset_link = f"{frontend_url}/reset-password?token={reset_token}"
        
        subject = "🔐 Password reset - Training System"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
                    🔐 Password reset
                </h2>
                
                <p style="font-size: 16px;">Hello, {user_name}!</p>
                
                <p style="font-size: 14px; color: #555;">
                    You requested a password reset for your Training System account.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" 
                       style="display: inline-block; padding: 15px 30px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                
                <p style="font-size: 13px; color: #666;">
                    If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="font-size: 12px; color: #999; word-break: break-all;">
                    {reset_link}
                </p>
                
                <p style="font-size: 13px; color: #999; margin-top: 30px;">
                    The link is valid for 1 hour.
                </p>
                
                <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
                    <p style="margin: 0; font-size: 13px; color: #991b1b;">
                        <strong>Important:</strong> If you did not request a password reset, please ignore this email. Your password will remain unchanged.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        self.send_email([user_email], subject, html_body, "password_reset")
