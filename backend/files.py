from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
import os
from pathlib import Path

router = APIRouter(tags=["files"])

UPLOADS_DIR = "/tmp/slideconfirm_uploads"

@router.get("/slides/image/{presentation_id}/{filename}")
def get_slide_image(presentation_id: int, filename: str):
    """Получить изображение слайда"""
    # Проверяем, что filename содержит только разрешенные символы
    if not filename.endswith('.jpg'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only JPG files are allowed")
    
    if '/' in filename or '\\' in filename or '..' in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename")
    
    file_path = f"{UPLOADS_DIR}/slides/{presentation_id}/{filename}"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    
    return FileResponse(
        file_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "max-age=3600"}
    )
