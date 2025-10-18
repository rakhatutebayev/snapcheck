from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, Slide, UserSlideProgress, UserCompletion, Presentation
from .schemas import ProgressResponse, SlidesListResponse, SlideResponse
from .utils.security import decode_access_token

router = APIRouter(prefix="/slides", tags=["slides"])

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

@router.get("/list", response_model=SlidesListResponse)
def list_slides(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Получаем первую опубликованную презентацию
    presentation = db.query(Presentation).filter(Presentation.status == "published").first()
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No published presentations found")
    
    presentation_id = presentation.id
    slides = db.query(Slide).filter(Slide.presentation_id == presentation_id).order_by(Slide.order).all()
    
    if not slides:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No slides found")
    
    # Получаем статус просмотра для каждого слайда
    slide_responses = []
    for slide in slides:
        progress = db.query(UserSlideProgress).filter(
            UserSlideProgress.user_id == user.id,
            UserSlideProgress.slide_id == slide.id
        ).first()
        
        slide_responses.append(SlideResponse(
            id=slide.id,
            presentation_id=slide.presentation_id,
            filename=slide.filename,
            order=slide.order,
            viewed=progress.viewed if progress else False
        ))
    
    return SlidesListResponse(
        presentation_id=presentation_id,
        total_slides=len(slides),
        slides=slide_responses
    )

@router.post("/mark/{slide_id}")
def mark_slide_viewed(slide_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Проверяем существование слайда
    slide = db.query(Slide).filter(Slide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slide not found")
    
    # Обновляем или создаём запись о просмотре
    progress = db.query(UserSlideProgress).filter(
        UserSlideProgress.user_id == user.id,
        UserSlideProgress.slide_id == slide_id
    ).first()
    
    if progress:
        progress.viewed = True
    else:
        progress = UserSlideProgress(user_id=user.id, slide_id=slide_id, viewed=True)
        db.add(progress)
    
    db.commit()
    return {"status": "success", "message": "Slide marked as viewed"}

@router.post("/complete")
def complete_presentation(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Получаем первую опубликованную презентацию
    presentation = db.query(Presentation).filter(Presentation.status == "published").first()
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No published presentations found")
    
    presentation_id = presentation.id
    all_slides = db.query(Slide).filter(Slide.presentation_id == presentation_id).all()
    
    if not all_slides:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No slides found")
    
    # Проверяем просмотрены ли все слайды
    viewed_slides = db.query(UserSlideProgress).filter(
        UserSlideProgress.user_id == user.id,
        UserSlideProgress.viewed == True
    ).with_entities(UserSlideProgress.slide_id).all()
    
    viewed_ids = {v[0] for v in viewed_slides}
    all_ids = {s.id for s in all_slides}
    
    missing = list(all_ids - viewed_ids)
    
    if missing:
        return {
            "status": "error",
            "message": f"Not all slides viewed",
            "missing_slides": sorted(missing)
        }
    
    # Проверяем не завершена ли уже презентация
    existing = db.query(UserCompletion).filter(
        UserCompletion.user_id == user.id,
        UserCompletion.presentation_id == presentation_id
    ).first()
    
    if not existing:
        completion = UserCompletion(
            user_id=user.id,
            presentation_id=presentation_id
        )
        db.add(completion)
        db.commit()
    
    return {"status": "success", "message": "Presentation completed"}

@router.get("/progress", response_model=ProgressResponse)
def get_progress(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Получаем первую опубликованную презентацию
    presentation = db.query(Presentation).filter(Presentation.status == "published").first()
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No published presentations found")
    
    presentation_id = presentation.id
    all_slides = db.query(Slide).filter(Slide.presentation_id == presentation_id).all()
    
    viewed_count = db.query(UserSlideProgress).filter(
        UserSlideProgress.user_id == user.id,
        UserSlideProgress.viewed == True
    ).count()
    
    total_count = len(all_slides)
    percentage = (viewed_count / total_count * 100) if total_count > 0 else 0
    
    return ProgressResponse(
        presentation_id=presentation_id,
        viewed_count=viewed_count,
        total_count=total_count,
        percentage=percentage
    )
