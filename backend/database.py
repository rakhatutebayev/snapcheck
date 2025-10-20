import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ✅ Используем DATABASE_URL из переменных окружения (production PostgreSQL)
# или SQLite для разработки
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:////tmp/slideconfirm.db"
)

# ✅ Для SQLite нужны дополнительные параметры
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        echo=False, 
        connect_args={"check_same_thread": False}
    )
else:
    # ✅ Для PostgreSQL
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        echo=False,
        pool_pre_ping=True,  # Проверяет соединение перед использованием
        pool_recycle=3600,   # Переподключается каждый час
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
