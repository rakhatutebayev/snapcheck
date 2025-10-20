"""Initial migration: create all tables

Revision ID: 001_initial_migration
Revises: 
Create Date: 2025-10-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers used by Alembic.
revision = '001_initial_migration'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ✅ Создание таблицы users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # ✅ Создание таблицы presentations
    op.create_table(
        'presentations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_presentations_id'), 'presentations', ['id'], unique=False)

    # ✅ Создание таблицы slides
    op.create_table(
        'slides',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('presentation_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['presentation_id'], ['presentations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_slides_id'), 'slides', ['id'], unique=False)
    op.create_index(op.f('ix_slides_presentation_id'), 'slides', ['presentation_id'], unique=False)

    # ✅ Создание таблицы user_slide_progress
    op.create_table(
        'user_slide_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('slide_id', sa.Integer(), nullable=False),
        sa.Column('viewed', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['slide_id'], ['slides.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_slide_progress_id'), 'user_slide_progress', ['id'], unique=False)

    # ✅ Создание таблицы user_completion
    op.create_table(
        'user_completion',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('presentation_id', sa.Integer(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['presentation_id'], ['presentations.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_completion_id'), 'user_completion', ['id'], unique=False)

    # ✅ Создание таблицы user_presentation_position
    op.create_table(
        'user_presentation_position',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('presentation_id', sa.Integer(), nullable=False),
        sa.Column('last_slide_index', sa.Integer(), nullable=True),
        sa.Column('last_viewed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['presentation_id'], ['presentations.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_presentation_position_id'), 'user_presentation_position', ['id'], unique=False)
    op.create_index(op.f('ix_user_presentation_position_presentation_id'), 'user_presentation_position', ['presentation_id'], unique=False)
    op.create_index(op.f('ix_user_presentation_position_user_id'), 'user_presentation_position', ['user_id'], unique=False)


def downgrade() -> None:
    # Откат миграции в обратном порядке
    op.drop_index(op.f('ix_user_presentation_position_user_id'), table_name='user_presentation_position')
    op.drop_index(op.f('ix_user_presentation_position_presentation_id'), table_name='user_presentation_position')
    op.drop_index(op.f('ix_user_presentation_position_id'), table_name='user_presentation_position')
    op.drop_table('user_presentation_position')
    
    op.drop_index(op.f('ix_user_completion_id'), table_name='user_completion')
    op.drop_table('user_completion')
    
    op.drop_index(op.f('ix_user_slide_progress_id'), table_name='user_slide_progress')
    op.drop_table('user_slide_progress')
    
    op.drop_index(op.f('ix_slides_presentation_id'), table_name='slides')
    op.drop_index(op.f('ix_slides_id'), table_name='slides')
    op.drop_table('slides')
    
    op.drop_index(op.f('ix_presentations_id'), table_name='presentations')
    op.drop_table('presentations')
    
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
