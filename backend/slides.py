from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from database import get_db
from models import User, Slide, UserSlideProgress, UserCompletion, Presentation, UserPresentationPosition
from schemas import ProgressResponse, SlidesListResponse, SlideResponse
from utils.security import decode_access_token

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
def list_slides(presentation_id: int = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Если presentation_id не указан, берём первую опубликованную
    if presentation_id:
        presentation = db.query(Presentation).filter(
            Presentation.id == presentation_id,
            Presentation.status == "published"
        ).first()
    else:
        presentation = db.query(Presentation).filter(Presentation.status == "published").first()
    
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No published presentations found")
    
    presentation_id = presentation.id
    slides = db.query(Slide).filter(Slide.presentation_id == presentation_id).order_by(Slide.order).all()
    
    if not slides:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No slides found")
    
    # ✅ Получаем последнюю позицию пользователя
    position = db.query(UserPresentationPosition).filter(
        UserPresentationPosition.user_id == user.id,
        UserPresentationPosition.presentation_id == presentation_id
    ).first()
    
    last_slide_index = position.last_slide_index if position else 0
    
    # Получаем статус просмотра для каждого слайда
    slide_responses = []
    for idx, slide in enumerate(slides):
        progress = db.query(UserSlideProgress).filter(
            UserSlideProgress.user_id == user.id,
            UserSlideProgress.slide_id == slide.id
        ).first()
        
        # ✅ Проверяем, разрешено ли просмотреть этот слайд
        # Слайд доступен если:
        # 1. Это первый слайд
        # 2. Все предыдущие слайды просмотрены
        can_view = idx == 0  # Первый слайд всегда доступен
        
        if not can_view and idx > 0:
            # Проверяем просмотрены ли все предыдущие слайды
            previous_slides = [s for s in slides[:idx]]
            can_view = all(
                db.query(UserSlideProgress).filter(
                    UserSlideProgress.user_id == user.id,
                    UserSlideProgress.slide_id == prev_slide.id,
                    UserSlideProgress.viewed == True
                ).first() is not None
                for prev_slide in previous_slides
            )
        
        slide_responses.append(SlideResponse(
            id=slide.id,
            presentation_id=slide.presentation_id,
            filename=slide.filename,
            order=slide.order,
            viewed=progress.viewed if progress else False,
            can_view=can_view  # ✅ Добавляем информацию о доступности
        ))
    
    return SlidesListResponse(
        presentation_id=presentation_id,
        total_slides=len(slides),
        slides=slide_responses,
        last_slide_index=last_slide_index  # ✅ Возвращаем позицию
    )

@router.post("/mark/{slide_id}")
def mark_slide_viewed(slide_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Проверяем существование слайда
    slide = db.query(Slide).filter(Slide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slide not found")
    
    # ✅ Проверяем последовательность просмотра
    # Получаем все слайды этой презентации в порядке
    all_slides = db.query(Slide).filter(
        Slide.presentation_id == slide.presentation_id
    ).order_by(Slide.order).all()
    
    # Находим индекс текущего слайда
    current_index = next((idx for idx, s in enumerate(all_slides) if s.id == slide_id), None)
    
    if current_index is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid slide")
    
    # Проверяем просмотрены ли все предыдущие слайды
    if current_index > 0:
        for prev_slide in all_slides[:current_index]:
            prev_progress = db.query(UserSlideProgress).filter(
                UserSlideProgress.user_id == user.id,
                UserSlideProgress.slide_id == prev_slide.id,
                UserSlideProgress.viewed == True
            ).first()
            
            if not prev_progress:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"You must view slides in order. Please review slide {prev_slide.order + 1} first."
                )
    
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
    
    # ✅ Обновляем последнюю позицию
    position = db.query(UserPresentationPosition).filter(
        UserPresentationPosition.user_id == user.id,
        UserPresentationPosition.presentation_id == slide.presentation_id
    ).first()
    
    if position:
        position.last_slide_index = current_index
    else:
        position = UserPresentationPosition(
            user_id=user.id,
            presentation_id=slide.presentation_id,
            last_slide_index=current_index
        )
        db.add(position)
    
    db.commit()
    return {"status": "success", "message": "Slide marked as viewed"}


@router.post("/complete")
def complete_presentation(presentation_id: int = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Если presentation_id не указан, берём первую опубликованную
    if presentation_id:
        presentation = db.query(Presentation).filter(
            Presentation.id == presentation_id,
            Presentation.status == "published"
        ).first()
    else:
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
def get_progress(presentation_id: int = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Если presentation_id не указан, берём первую опубликованную
    if presentation_id:
        presentation = db.query(Presentation).filter(
            Presentation.id == presentation_id,
            Presentation.status == "published"
        ).first()
    else:
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
