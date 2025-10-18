"""
API для управления пользователями и отчетами.
Старые функции PPTX перенесены в slides_admin.py
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pathlib import Path

from .database import get_db
from .models import User, Presentation, UserCompletion
from .utils.security import decode_access_token, hash_password

router = APIRouter(prefix="/admin", tags=["admin"])

UPLOADS_DIR = "/tmp/slideconfirm_uploads"
Path(UPLOADS_DIR).mkdir(parents=True, exist_ok=True)


def get_current_admin(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Проверяет, что пользователь - администратор"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    return user


@router.get("/presentations")
def get_presentations(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Получить список всех презентаций"""
    presentations = db.query(Presentation).all()
    return {
        "status": "success",
        "data": [
            {
                "id": p.id,
                "title": p.title,
                "filename": p.filename,
                "status": p.status,
                "uploaded_at": p.uploaded_at.isoformat(),
                "published_at": p.published_at.isoformat() if p.published_at else None
            }
            for p in presentations
        ]
    }


@router.get("/users")
def get_users(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Получить список всех пользователей"""
    users = db.query(User).all()
    return {
        "status": "success",
        "data": [
            {
                "id": u.id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "email": u.email,
                "role": u.role,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ]
    }


@router.post("/create_user")
def create_user(first_name: str, last_name: str, email: str, password: str, role: str = "user", admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Создать нового пользователя"""
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
    
    user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        password_hash=hash_password(password),
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {
        "status": "success",
        "message": "User created",
        "data": {
            "id": user.id,
            "email": user.email,
            "role": user.role
        }
    }


@router.put("/set_role/{user_id}")
def set_user_role(user_id: int, role: str, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Установить роль пользователя"""
    if role not in ["user", "admin"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    user.role = role
    db.commit()
    
    return {"status": "success", "message": f"User role updated to {role}"}


@router.get("/report")
def get_report(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Получить отчет об ознакомлении с презентациями"""
    # Получаем всех пользователей (не админов)
    all_users = db.query(User).filter(User.role == "user").all()
    users_count = len(all_users)
    
    # Получаем пользователей, которые завершили
    completed_users = db.query(UserCompletion.user_id).distinct().all()
    completed_user_ids = {uc[0] for uc in completed_users}
    completed = len(completed_user_ids)
    
    # Формируем списки пользователей
    users_data = []
    for user in all_users:
        is_completed = user.id in completed_user_ids
        completion_count = db.query(UserCompletion).filter(UserCompletion.user_id == user.id).count()
        
        users_data.append({
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "completion_count": completion_count,
            "is_completed": is_completed
        })
    
    return {
        "status": "success",
        "data": {
            "total_users": users_count,
            "completed": completed,
            "pending": users_count - completed,
            "completion_percentage": (completed / users_count * 100) if users_count > 0 else 0,
            "users": users_data
        }
    }
