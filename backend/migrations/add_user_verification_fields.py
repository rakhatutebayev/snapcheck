"""
Миграция для добавления полей верификации email и сброса пароля
"""
from sqlalchemy import Column, Boolean, String, DateTime, text
from ..database import engine

def upgrade():
    """Добавить поля is_verified, verification_token, verification_token_expires, reset_token, reset_token_expires"""
    with engine.begin() as conn:
        # Проверяем, существуют ли уже колонки
        result = conn.execute(text("PRAGMA table_info(users)"))
        existing_columns = {row[1] for row in result}
        
        # Добавляем колонки, если их еще нет
        if 'is_verified' not in existing_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0"))
        
        if 'verification_token' not in existing_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN verification_token VARCHAR"))
        
        if 'verification_token_expires' not in existing_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN verification_token_expires DATETIME"))
        
        if 'reset_token' not in existing_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR"))
        
        if 'reset_token_expires' not in existing_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME"))
        
        print("✅ Migration completed: User verification fields added")

def downgrade():
    """Удалить поля (для SQLite не поддерживается напрямую)"""
    print("⚠️ Downgrade not supported for SQLite")

if __name__ == "__main__":
    upgrade()
