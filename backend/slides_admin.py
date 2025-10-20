"""
API для управления слайдами (загрузка из папки, редактирование, публикация)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
import os
from pathlib import Path
import shutil
from typing import List
import re

from database import get_db
from models import Presentation, Slide, User
from utils.security import decode_access_token

router = APIRouter(prefix="/admin", tags=["admin-slides"])

UPLOADS_DIR = "/tmp/slideconfirm_uploads"

def verify_admin(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Проверяет, что пользователь - администратор"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not admin")
    
    return user


@router.post("/slides/check-folder")
def check_folder_for_slides(
    folder_path: str,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """
    Проверяет папку и возвращает найденные слайды (для предпросмотра перед загрузкой)
    """
    # Проверяем, что папка существует
    if not os.path.isdir(folder_path):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                          detail=f"Папка не найдена: {folder_path}")
    
    # Ищем файлы slide*.jpg
    slide_files = []
    for i in range(1, 1000):  # Максимум 999 слайдов
        filename = f"slide{i}.jpg"
        filepath = os.path.join(folder_path, filename)
        
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            slide_files.append({
                "order": i,
                "filename": filename,
                "size": size
            })
        elif i > 1 and not os.path.exists(os.path.join(folder_path, f"slide{i-1}.jpg")):
            break
    
    if not slide_files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                          detail="В папке не найдены файлы slide*.jpg")
    
    return {
        "status": "success",
        "folder_path": folder_path,
        "slides_count": len(slide_files),
        "slides": slide_files
    }


@router.post("/slides/upload-from-folder")
def upload_slides_from_folder(
    folder_path: str,
    presentation_title: str,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """
    Загружает слайды из папки (slide1.jpg, slide2.jpg, ...)
    """
    # Проверяем, что папка существует
    if not os.path.isdir(folder_path):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                          detail=f"Папка не найдена: {folder_path}")
    
    # Ищем файлы slide*.jpg
    slide_files = []
    for i in range(1, 1000):  # Максимум 999 слайдов
        filename = f"slide{i}.jpg"
        filepath = os.path.join(folder_path, filename)
        
        if os.path.exists(filepath):
            slide_files.append((i, filename, filepath))
        elif i > 1 and not os.path.exists(os.path.join(folder_path, f"slide{i-1}.jpg")):
            # Если нет слайда i-1, значит слайдов больше нет
            break
    
    if not slide_files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                          detail="В папке не найдены файлы slide*.jpg")
    
    # Создаем презентацию
    presentation = Presentation(
        title=presentation_title,
        filename=os.path.basename(folder_path),
        status="draft"
    )
    db.add(presentation)
    db.flush()  # Получаем ID без коммита
    
    # Создаем директорию для хранения
    dest_dir = os.path.join(UPLOADS_DIR, "slides", str(presentation.id))
    os.makedirs(dest_dir, exist_ok=True)
    
    # Копируем слайды и создаем записи в БД
    created_slides = []
    for order, filename, filepath in slide_files:
        # Копируем файл
        dest_path = os.path.join(dest_dir, filename)
        shutil.copy2(filepath, dest_path)
        
        # Создаем запись в БД
        slide = Slide(
            presentation_id=presentation.id,
            filename=filename,
            order=order,
            title=f"Слайд {order}"  # Название по умолчанию
        )
        db.add(slide)
        created_slides.append(slide)
    
    db.commit()
    db.refresh(presentation)
    
    return {
        "status": "success",
        "presentation": {
            "id": presentation.id,
            "title": presentation.title,
            "status": presentation.status,
            "slides_count": len(created_slides)
        },
        "slides_count": len(created_slides),
        "message": f"Загружено {len(created_slides)} слайдов"
    }


@router.post("/slides/upload-from-files")
async def upload_slides_from_files(
    presentation_title: str = Form(...),
    slides: List[UploadFile] = File(...),
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """
    Загружает слайды из файлов (загруженных через браузер)
    Файлы должны быть названы: slide1.jpg, slide2.jpg, и т.д.
    (Frontend переименовывает файлы в нужный формат)
    """
    if not slides or len(slides) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                          detail="Не загружены файлы")
    
    # Проверяем, что все файлы - это JPG
    slide_mapping = {}
    for file in slides:
        # Проверяем расширение файла
        if not file.filename.lower().endswith(('.jpg', '.jpeg')):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                              detail=f"Файл {file.filename} не является JPG")
        
        # Извлекаем номер слайда из имени файла (уже переименовано на frontend'е в slide1.jpg, slide2.jpg)
        match = re.match(r'^slide(\d+)\.(jpg|jpeg)$', file.filename.lower())
        if not match:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                              detail=f"Имя файла {file.filename} должно быть в формате: slide1.jpg, slide2.jpg и т.д.")
        
        slide_num = int(match.group(1))
        slide_mapping[slide_num] = file
    
    if not slide_mapping:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                          detail="Не найдены файлы слайдов")
    
    # Проверяем, что слайды идут по порядку (1, 2, 3, ...)
    sorted_slides = sorted(slide_mapping.keys())
    for i, slide_num in enumerate(sorted_slides, 1):
        if slide_num != i:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                              detail=f"Слайды должны быть названы по порядку: slide1.jpg, slide2.jpg, и т.д. (нарушен номер: {slide_num})")
    
    # Создаем презентацию
    presentation = Presentation(
        title=presentation_title,
        filename="upload",
        status="draft"
    )
    db.add(presentation)
    db.flush()  # Получаем ID без коммита
    
    # Создаем директорию для хранения
    dest_dir = os.path.join(UPLOADS_DIR, "slides", str(presentation.id))
    os.makedirs(dest_dir, exist_ok=True)
    
    # Сохраняем файлы и создаем записи в БД
    created_slides = []
    for order in sorted_slides:
        file = slide_mapping[order]
        filename = f"slide{order}.jpg"
        dest_path = os.path.join(dest_dir, filename)
        
        # Сохраняем файл
        content = await file.read()
        with open(dest_path, 'wb') as f:
            f.write(content)
        
        # Создаем запись в БД
        slide = Slide(
            presentation_id=presentation.id,
            filename=filename,
            order=order,
            title=f"Слайд {order}"  # Название по умолчанию
        )
        db.add(slide)
        created_slides.append(slide)
    
    db.commit()
    db.refresh(presentation)
    
    return {
        "status": "success",
        "presentation": {
            "id": presentation.id,
            "title": presentation.title,
            "status": presentation.status,
            "slides_count": len(created_slides)
        },
        "slides_count": len(created_slides),
        "message": f"Загружено {len(created_slides)} слайдов"
    }


@router.get("/slides/{presentation_id}")
def get_presentation_slides(
    presentation_id: int,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Получает все слайды презентации"""
    presentation = db.query(Presentation).filter(
        Presentation.id == presentation_id
    ).first()
    
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")
    
    slides = db.query(Slide).filter(
        Slide.presentation_id == presentation_id
    ).order_by(Slide.order).all()
    
    return {
        "status": "success",
        "presentation": {
            "id": presentation.id,
            "title": presentation.title,
            "status": presentation.status
        },
        "slides": [
            {
                "id": slide.id,
                "filename": slide.filename,
                "title": slide.title,
                "order": slide.order
            }
            for slide in slides
        ]
    }


@router.put("/slides/{slide_id}/title")
def update_slide_title(
    slide_id: int,
    title: str,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Обновляет название слайда"""
    slide = db.query(Slide).filter(Slide.id == slide_id).first()
    
    if not slide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slide not found")
    
    slide.title = title
    db.commit()
    db.refresh(slide)
    
    return {
        "status": "success",
        "slide": {
            "id": slide.id,
            "title": slide.title,
            "order": slide.order
        }
    }


@router.post("/presentations/{presentation_id}/publish")
def publish_presentation(
    presentation_id: int,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Опубликовывает презентацию"""
    presentation = db.query(Presentation).filter(
        Presentation.id == presentation_id
    ).first()
    
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")
    
    if presentation.status == "published":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                          detail="Presentation already published")
    
    presentation.status = "published"
    from datetime import datetime
    presentation.published_at = datetime.utcnow()
    
    db.commit()
    db.refresh(presentation)
    
    slides_count = db.query(Slide).filter(
        Slide.presentation_id == presentation_id
    ).count()
    
    return {
        "status": "success",
        "message": f"Презентация опубликована ({slides_count} слайдов)",
        "presentation": {
            "id": presentation.id,
            "title": presentation.title,
            "status": presentation.status
        }
    }


@router.post("/presentations/{presentation_id}/unpublish")
def unpublish_presentation(
    presentation_id: int,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Отменяет публикацию презентации"""
    presentation = db.query(Presentation).filter(
        Presentation.id == presentation_id
    ).first()
    
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")
    
    if presentation.status == "draft":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                          detail="Presentation is already draft")
    
    presentation.status = "draft"
    db.commit()
    db.refresh(presentation)
    
    return {
        "status": "success",
        "message": "Публикация отменена",
        "presentation": {
            "id": presentation.id,
            "title": presentation.title,
            "status": presentation.status
        }
    }


@router.delete("/presentations/{presentation_id}")
def delete_presentation(
    presentation_id: int,
    confirm: bool = False,  # Требуется подтверждение
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Удаляет презентацию со всеми слайдами"""
    if not confirm:
        return {
            "status": "warning",
            "message": "Требуется подтверждение удаления",
            "confirm": False
        }
    
    presentation = db.query(Presentation).filter(
        Presentation.id == presentation_id
    ).first()
    
    if not presentation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presentation not found")
    
    # Получаем слайды перед удалением
    slides = db.query(Slide).filter(
        Slide.presentation_id == presentation_id
    ).all()
    slides_count = len(slides)
    
    # Удаляем файлы со слайдами
    slides_dir = os.path.join(UPLOADS_DIR, "slides", str(presentation_id))
    if os.path.exists(slides_dir):
        shutil.rmtree(slides_dir)
    
    # Удаляем слайды и презентацию из БД (cascade сделает это автоматически)
    for slide in slides:
        db.delete(slide)
    
    db.delete(presentation)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Презентация удалена ({slides_count} слайдов)",
        "presentation_id": presentation_id
    }
