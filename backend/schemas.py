from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    first_name: str = "-"
    last_name: str = "-"

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Slide Schemas
class SlideResponse(BaseModel):
    id: int
    presentation_id: int
    filename: str
    title: Optional[str] = None
    order: int
    viewed: bool = False

    class Config:
        from_attributes = True

class SlidesListResponse(BaseModel):
    presentation_id: int
    total_slides: int
    slides: list[SlideResponse]

# Progress Schemas
class ProgressResponse(BaseModel):
    presentation_id: int
    viewed_count: int
    total_count: int
    percentage: float

# Token Schema
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
