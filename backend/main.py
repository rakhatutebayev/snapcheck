from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine, SessionLocal
from models import User
from auth import router as auth_router
from slides import router as slides_router
from admin import router as admin_router
from slides_admin import router as slides_admin_router
from files import router as files_router
from user import router as user_router
from utils.security import hash_password

# Создание таблиц
models.Base.metadata.create_all(bind=engine)

# Создание начальных пользователей
def create_initial_data():
    try:
        db = SessionLocal()
        try:
            if not db.query(User).filter_by(email="user@gss.aero").first():
                db.add(User(
                    first_name="User",
                    last_name="GSS",
                    email="user@gss.aero",
                    password_hash=hash_password("123456"),
                    role="user"
                ))
            if not db.query(User).filter_by(email="admin@gss.aero").first():
                db.add(User(
                    first_name="Admin",
                    last_name="GSS",
                    email="admin@gss.aero",
                    password_hash=hash_password("123456"),
                    role="admin"
                ))
            
            db.commit()
        finally:
            db.close()
    except Exception as e:
        print(f"Warning: Could not create initial data: {e}")

create_initial_data()

# Создание FastAPI приложения
app = FastAPI(
    title="SlideConfirm API",
    description="Corporate Slide Confirmation System",
    version="1.0.0"
)

# CORS конфигурация
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешить все origins для разработки
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Регистрация роутеров
app.include_router(auth_router)
app.include_router(slides_router)
app.include_router(admin_router)
app.include_router(slides_admin_router)
app.include_router(files_router)
app.include_router(user_router)

@app.get("/")
def root():
    return {
        "status": "success",
        "message": "SlideConfirm API is running",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "ok"}
