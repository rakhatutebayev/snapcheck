"""
Email notification service
SMTP-only configuration
"""
import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from .email_models import EmailSettings, EmailLog


class EmailService:
    """Сервис отправки email уведомлений через SMTP"""
    
    def __init__(self, db: Session):
        self.db = db
        self.settings = self._get_settings()
    
    def _get_settings(self) -> Optional[EmailSettings]:
        """Получить настройки email"""
        return self.db.query(EmailSettings).first()
    
    def send_email(self, to_emails: List[str], subject: str, html_body: str, event_type: str) -> tuple[bool, str]:
        """Отправить email уведомление через SMTP"""
        if not self.settings or not self.settings.notifications_enabled:
            return False, "Email notifications are disabled"
        
        try:
            # Динамическое имя отправителя в зависимости от типа события
            if event_type == "registration":
                from_name = f"{self.settings.from_name} - User Registration"
            elif event_type == "completion":
                from_name = f"{self.settings.from_name} - Training Completed"
            elif event_type == "test":
                from_name = f"{self.settings.from_name} - Test Email"
            else:
                from_name = self.settings.from_name
            
            # Создать MIME сообщение
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{self.settings.from_email}>"
            msg["To"] = ", ".join(to_emails)
            
            # Добавить HTML тело
            html_part = MIMEText(html_body, "html")
            msg.attach(html_part)
            
            # Подключиться к SMTP и отправить
            encryption = self.settings.encryption.lower() if self.settings.encryption else "tls"
            
            if encryption == "starttls":
                server = smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port, timeout=10)
                server.starttls()
            elif encryption == "ssl":
                server = smtplib.SMTP_SSL(self.settings.smtp_host, self.settings.smtp_port, timeout=10)
            else:  # tls by default
                server = smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port, timeout=10)
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
        return success, error_msg or "Email sent successfully"
    
    def send_registration_notification(self, user_email: str, user_name: str):
        """Отправить уведомление о регистрации"""
        if not self.settings or not self.settings.notify_on_registration:
            return
        
        # Получить адреса администраторов из таблицы NotificationAdmin
        from .email_models import NotificationAdmin
        admins = self.db.query(NotificationAdmin).filter(
            NotificationAdmin.is_active == True,
            NotificationAdmin.receive_registration_notifications == True
        ).all()
        
        recipients = [admin.email for admin in admins]
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
        
        # Получить адреса администраторов из таблицы NotificationAdmin
        from .email_models import NotificationAdmin
        admins = self.db.query(NotificationAdmin).filter(
            NotificationAdmin.is_active == True,
            NotificationAdmin.receive_completion_notifications == True
        ).all()
        
        recipients = [admin.email for admin in admins]
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
                    <p style="margin: 5px 0;"><strong>SMTP Host:</strong> {self.settings.smtp_host if self.settings else 'Не настроен'}</p>
                    <p style="margin: 5px 0;"><strong>From Email:</strong> {self.settings.from_email if self.settings else 'Не настроен'}</p>
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
            success, error_msg = self.send_email([test_recipient], subject, html_body, "test")
            if success:
                # Обновить время последнего теста
                if self.settings:
                    self.settings.last_test_at = datetime.utcnow()
                    self.db.commit()
                return True, "Тестовое письмо успешно отправлено"
            else:
                return False, error_msg or "Ошибка отправки письма"
        except Exception as e:
            return False, str(e)
