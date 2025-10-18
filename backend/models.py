from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    progress = relationship("UserSlideProgress", back_populates="user", cascade="all, delete-orphan")
    completions = relationship("UserCompletion", back_populates="user", cascade="all, delete-orphan")

class Presentation(Base):
    __tablename__ = "presentations"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    status = Column(String, default="draft")  # draft или published
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)

class Slide(Base):
    __tablename__ = "slides"
    
    id = Column(Integer, primary_key=True, index=True)
    presentation_id = Column(Integer, ForeignKey("presentations.id"), index=True)
    filename = Column(String, nullable=False)
    title = Column(String, nullable=True)  # Название слайда
    order = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    progress = relationship("UserSlideProgress", back_populates="slide", cascade="all, delete-orphan")

class UserSlideProgress(Base):
    __tablename__ = "user_slide_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    slide_id = Column(Integer, ForeignKey("slides.id"))
    viewed = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="progress")
    slide = relationship("Slide", back_populates="progress")

class UserCompletion(Base):
    __tablename__ = "user_completion"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    presentation_id = Column(Integer, ForeignKey("presentations.id"))
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="completions")
