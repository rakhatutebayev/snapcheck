from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from database import get_db
from models import User, Slide, UserSlideProgress, UserCompletion, Presentation
from utils.security import decode_access_token

router = APIRouter(prefix="/user", tags=["user"])

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return user

@router.get("/presentations")
def get_user_presentations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Получить список всех опубликованных презентаций с прогрессом пользователя
    """
    # Получаем все опубликованные презентации
    presentations = db.query(Presentation).filter(Presentation.status == "published").all()
    
    if not presentations:
        return {"data": []}
    
    result = []
    
    for presentation in presentations:
        # Получаем количество слайдов в презентации
        slides = db.query(Slide).filter(Slide.presentation_id == presentation.id).all()
        total_slides = len(slides)
        
        # Получаем количество просмотренных слайдов пользователем
        viewed_slides_count = db.query(UserSlideProgress).filter(
            UserSlideProgress.user_id == user.id,
            UserSlideProgress.slide_id.in_([s.id for s in slides]),
            UserSlideProgress.viewed == True
        ).count()
        
        # Проверяем статус презентации для пользователя
        completion = db.query(UserCompletion).filter(
            UserCompletion.user_id == user.id,
            UserCompletion.presentation_id == presentation.id
        ).first()
        
        # Определяем статус
        if completion:
            status_val = "completed"
        elif viewed_slides_count > 0:
            status_val = "in_progress"
        else:
            status_val = "not_started"
        
        # Вычисляем процент прогресса
        progress_percentage = (viewed_slides_count / total_slides * 100) if total_slides > 0 else 0
        
        result.append({
            "id": presentation.id,
            "title": presentation.title,
            "slides_count": total_slides,
            "status": status_val,
            "progress": int(progress_percentage),
            "viewed_slides": viewed_slides_count
        })
    
    return {"data": result}

@router.post("/presentations/{presentation_id}/reset")
def reset_presentation(presentation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Сбросить прогресс пользователя для презентации (удалить все просмотры и завершение)
    """
    # Проверяем существование презентации
    presentation = db.query(Presentation).filter(Presentation.id == presentation_id).first()
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")
    
    # Получаем все слайды презентации
    slides = db.query(Slide).filter(Slide.presentation_id == presentation_id).all()
    slide_ids = [s.id for s in slides]
    
    # Удаляем все записи о просмотрах
    db.query(UserSlideProgress).filter(
        UserSlideProgress.user_id == user.id,
        UserSlideProgress.slide_id.in_(slide_ids)
    ).delete()
    
    # Удаляем запись о завершении
    db.query(UserCompletion).filter(
        UserCompletion.user_id == user.id,
        UserCompletion.presentation_id == presentation_id
    ).delete()
    
    db.commit()
    
    return {"status": "success", "message": "Presentation progress reset"}
