"""
Email notification service
Supports Office 365, Google, and SMTP
"""
import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import List, Optional
import requests
from sqlalchemy.orm import Session
import os

from .email_models import EmailSettings, EmailLog


class EmailService:
    """Сервис отправки email уведомлений"""
    
    def __init__(self, db: Session):
        self.db = db
        self.settings = self._get_settings()
    
    def _get_settings(self) -> Optional[EmailSettings]:
        """Получить настройки email"""
        return self.db.query(EmailSettings).first()
    
    def _refresh_oauth_token(self, settings: EmailSettings) -> bool:
        """Обновить OAuth2 токен"""
        if not settings.refresh_token:
            return False
        
        try:
            if settings.provider == "office365":
                # Microsoft Graph API token refresh
                token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
                client_id = settings.client_id or os.getenv("MICROSOFT_CLIENT_ID")
                client_secret = settings.client_secret or os.getenv("MICROSOFT_CLIENT_SECRET")
                data = {
                    "client_id": client_id,
                    "refresh_token": settings.refresh_token,
                    "grant_type": "refresh_token",
                    "scope": "https://graph.microsoft.com/Mail.Send offline_access",
                }
                if client_secret:
                    data["client_secret"] = client_secret
            elif settings.provider == "google":
                # Google OAuth token refresh
                token_url = "https://oauth2.googleapis.com/token"
                client_id = settings.client_id or os.getenv("GOOGLE_CLIENT_ID")
                client_secret = settings.client_secret or os.getenv("GOOGLE_CLIENT_SECRET")
                data = {
                    "client_id": client_id,
                    "refresh_token": settings.refresh_token,
                    "grant_type": "refresh_token",
                }
                if client_secret:
                    data["client_secret"] = client_secret
            else:
                return False
            
            response = requests.post(token_url, data=data)
            response.raise_for_status()
            token_data = response.json()
            
            # Обновить токен в БД
            settings.access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 3600)
            settings.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            
            self.db.commit()
            return True
            
        except Exception as e:
            print(f"Failed to refresh OAuth token: {e}")
            return False
    
    def _send_via_office365(self, to_emails: List[str], subject: str, html_body: str) -> bool:
        """Отправка через Office 365 Graph API"""
        settings = self.settings
        
        # Проверить и обновить токен если нужно
        if not settings.access_token or \
           (settings.token_expires_at and datetime.utcnow() >= settings.token_expires_at):
            if not self._refresh_oauth_token(settings):
                return False
        
        try:
            url = "https://graph.microsoft.com/v1.0/me/sendMail"
            headers = {
                "Authorization": f"Bearer {settings.access_token}",
                "Content-Type": "application/json"
            }
            
            # Формат для Graph API
            to_recipients = [{"emailAddress": {"address": email}} for email in to_emails]
            
            data = {
                "message": {
                    "subject": subject,
                    "body": {
                        "contentType": "HTML",
                        "content": html_body
                    },
                    "toRecipients": to_recipients,
                    "from": {
                        "emailAddress": {
                            "address": settings.from_email,
                            "name": settings.from_name
                        }
                    }
                },
                "saveToSentItems": "true"
            }
            
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            return True
            
        except Exception as e:
            print(f"Office365 send error: {e}")
            return False
    
    def _send_via_google(self, to_emails: List[str], subject: str, html_body: str) -> bool:
        """Отправка через Google Gmail API"""
        settings = self.settings
        
        # Проверить и обновить токен если нужно
        if not settings.access_token or \
           (settings.token_expires_at and datetime.utcnow() >= settings.token_expires_at):
            if not self._refresh_oauth_token(settings):
                return False
        
        try:
            import base64
            from email.mime.text import MIMEText
            
            # Создать MIME сообщение
            message = MIMEText(html_body, "html")
            message["to"] = ", ".join(to_emails)
            message["from"] = f"{settings.from_name} <{settings.from_email}>"
            message["subject"] = subject
            
            # Кодировать в base64
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            # Отправить через Gmail API
            url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
            headers = {
                "Authorization": f"Bearer {settings.access_token}",
                "Content-Type": "application/json"
            }
            data = {"raw": raw_message}
            
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            return True
            
        except Exception as e:
            print(f"Google send error: {e}")
            return False
    
    def _send_via_smtp(self, to_emails: List[str], subject: str, html_body: str) -> tuple[bool, str]:
        """Отправка через обычный SMTP"""
        settings = self.settings
        
        try:
            # Создать MIME сообщение
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.from_name} <{settings.from_email}>"
            msg["To"] = ", ".join(to_emails)
            
            # Добавить HTML тело
            html_part = MIMEText(html_body, "html")
            msg.attach(html_part)
            
            # Подключиться к SMTP и отправить
            if settings.use_tls:
                server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10)
            
            server.login(settings.smtp_username, settings.smtp_password)
            server.sendmail(settings.from_email, to_emails, msg.as_string())
            server.quit()
            
            return True, "Email sent successfully"
            
        except smtplib.SMTPAuthenticationError as e:
            error_msg = f"Authentication failed: {str(e)}"
            print(f"SMTP send error: {error_msg}")
            return False, error_msg
        except smtplib.SMTPConnectError as e:
            error_msg = f"Connection failed: Unable to connect to {settings.smtp_host}:{settings.smtp_port}"
            print(f"SMTP send error: {error_msg}")
            return False, error_msg
        except smtplib.SMTPServerDisconnected as e:
            error_msg = f"Server disconnected unexpectedly: {str(e)}"
            print(f"SMTP send error: {error_msg}")
            return False, error_msg
        except smtplib.SMTPRecipientsRefused as e:
            error_msg = f"Recipients refused: {str(e)}"
            print(f"SMTP send error: {error_msg}")
            return False, error_msg
        except smtplib.SMTPException as e:
            error_msg = f"SMTP error: {str(e)}"
            print(f"SMTP send error: {error_msg}")
            return False, error_msg
        except TimeoutError:
            error_msg = f"Connection timeout: Could not connect to {settings.smtp_host}:{settings.smtp_port}"
            print(f"SMTP send error: {error_msg}")
            return False, error_msg
        except Exception as e:
            error_msg = f"Unexpected error: {type(e).__name__}: {str(e)}"
            print(f"SMTP send error: {error_msg}")
            return False, error_msg
    
    def send_email(self, to_emails: List[str], subject: str, html_body: str, event_type: str) -> tuple[bool, str]:
        """Отправить email уведомление"""
        if not self.settings or not self.settings.notifications_enabled:
            return False, "Email notifications are disabled"
        
        # Выбрать метод отправки
        if self.settings.provider == "office365":
            success = self._send_via_office365(to_emails, subject, html_body)
            error_msg = "Failed to send via Office365" if not success else None
        elif self.settings.provider == "google":
            success = self._send_via_google(to_emails, subject, html_body)
            error_msg = "Failed to send via Google" if not success else None
        elif self.settings.provider == "smtp":
            success, error_msg = self._send_via_smtp(to_emails, subject, html_body)
        else:
            success = False
            error_msg = f"Unknown provider: {self.settings.provider}"
        
        # Логировать отправку
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
        return success, error_msg if not success else "Email sent successfully"
    
    def send_registration_notification(self, user_email: str, user_name: str):
        """Отправить уведомление о регистрации"""
        if not self.settings or not self.settings.notify_on_registration:
            return
        
        recipients = json.loads(self.settings.notification_recipients or "[]")
        if not recipients:
            return
        
        subject = f"✅ Новая регистрация: {user_name}"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                    🎉 Новый пользователь зарегистрирован
                </h2>
                
                <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Имя:</strong> {user_name}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> {user_email}</p>
                    <p style="margin: 5px 0;"><strong>Дата:</strong> {datetime.now().strftime("%d.%m.%Y %H:%M")}</p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    Это автоматическое уведомление из системы SnapCheck.
                </p>
            </div>
        </body>
        </html>
        """
        
        self.send_email(recipients, subject, html_body, "registration")
    
    def send_completion_notification(self, user_name: str, user_email: str, 
                                     presentation_title: str, completed_at: datetime):
        """Отправить уведомление о прохождении презентации"""
        if not self.settings or not self.settings.notify_on_completion:
            return
        
        recipients = json.loads(self.settings.notification_recipients or "[]")
        if not recipients:
            return
        
        subject = f"✅ Презентация пройдена: {presentation_title}"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
                    ✅ Презентация успешно завершена
                </h2>
                
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Пользователь:</strong> {user_name}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> {user_email}</p>
                    <p style="margin: 5px 0;"><strong>Презентация:</strong> {presentation_title}</p>
                    <p style="margin: 5px 0;"><strong>Дата завершения:</strong> {completed_at.strftime("%d.%m.%Y %H:%M")}</p>
                </div>
                
                <div style="background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; color: #1e40af;">
                        <strong>✓</strong> Пользователь успешно ознакомился со всеми слайдами презентации.
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    Это автоматическое уведомление из системы SnapCheck.
                </p>
            </div>
        </body>
        </html>
        """
        
        self.send_email(recipients, subject, html_body, "completion")
    
    def send_test_email(self, test_recipient: str) -> tuple[bool, str]:
        """Отправить тестовое письмо"""
        subject = "🧪 Тестовое письмо от SnapCheck"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
                    🧪 Тестовое сообщение
                </h2>
                
                <div style="background-color: #faf5ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;">✅ Настройки email работают корректно!</p>
                    <p style="margin: 5px 0;"><strong>Провайдер:</strong> {self.settings.provider if self.settings else 'Не настроен'}</p>
                    <p style="margin: 5px 0;"><strong>Время отправки:</strong> {datetime.now().strftime("%d.%m.%Y %H:%M:%S")}</p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    Это тестовое уведомление из системы SnapCheck.
                </p>
            </div>
        </body>
        </html>
        """
        
        try:
            success = self.send_email([test_recipient], subject, html_body, "test")
            if success:
                # Обновить время последнего теста
                if self.settings:
                    self.settings.last_test_at = datetime.utcnow()
                    self.db.commit()
                return True, "Тестовое письмо успешно отправлено"
            else:
                return False, "Ошибка отправки письма"
        except Exception as e:
            return False, str(e)
