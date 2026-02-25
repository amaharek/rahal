"""add_updated_at_to_achievements

Revision ID: 8e82ec0f7342
Revises: 0003
Create Date: 2026-02-24 16:33:07.204700+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8e82ec0f7342'
down_revision: Union[str, None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing updated_at to achievements
    op.add_column(
        'achievements',
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
    )

    # user_achievements: rename profile_id → user_id, earned_at → unlocked_at,
    # add progress JSONB — needed for unlock_achievement() in Phase 2
    op.add_column(
        'user_achievements',
        sa.Column('user_id', sa.UUID(), nullable=True),  # nullable while we backfill
    )
    op.add_column(
        'user_achievements',
        sa.Column(
            'progress',
            postgresql.JSONB(astext_type=sa.Text()),
            server_default='{}',
            nullable=False,
        ),
    )
    op.add_column(
        'user_achievements',
        sa.Column('unlocked_at', sa.DateTime(timezone=True), nullable=True),
    )

    # Copy existing profile_id → user_id, earned_at → unlocked_at
    op.execute("UPDATE user_achievements SET user_id = profile_id")
    op.execute("UPDATE user_achievements SET unlocked_at = earned_at")

    # Now enforce NOT NULL and add FK
    op.alter_column('user_achievements', 'user_id', nullable=False)
    op.drop_constraint('user_achievements_unique', 'user_achievements', type_='unique')
    op.create_unique_constraint(
        'unique_user_achievement', 'user_achievements', ['user_id', 'achievement_id']
    )
    op.drop_constraint('user_achievements_profile_id_fkey', 'user_achievements', type_='foreignkey')
    op.create_foreign_key(
        None, 'user_achievements', 'profiles', ['user_id'], ['id'], ondelete='CASCADE'
    )
    # CASCADE to drop the Supabase RLS policy that references profile_id
    op.execute('ALTER TABLE user_achievements DROP COLUMN profile_id CASCADE')
    op.execute('ALTER TABLE user_achievements DROP COLUMN IF EXISTS earned_at')


def downgrade() -> None:
    op.add_column('user_achievements', sa.Column('earned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    op.add_column('user_achievements', sa.Column('profile_id', sa.UUID(), nullable=True))
    op.execute("UPDATE user_achievements SET profile_id = user_id")
    op.execute("UPDATE user_achievements SET earned_at = unlocked_at")
    op.alter_column('user_achievements', 'profile_id', nullable=False)
    op.drop_constraint(None, 'user_achievements', type_='foreignkey')
    op.create_foreign_key('user_achievements_profile_id_fkey', 'user_achievements', 'profiles', ['profile_id'], ['id'], ondelete='CASCADE')
    op.drop_constraint('unique_user_achievement', 'user_achievements', type_='unique')
    op.create_unique_constraint('user_achievements_unique', 'user_achievements', ['profile_id', 'achievement_id'])
    op.drop_column('user_achievements', 'unlocked_at')
    op.drop_column('user_achievements', 'progress')
    op.drop_column('user_achievements', 'user_id')
    op.drop_column('achievements', 'updated_at')
