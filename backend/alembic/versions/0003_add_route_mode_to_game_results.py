"""Add route mode to game results.

Revision ID: 0003
Revises: 0002
Create Date: 2026-02-18 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "game_results",
        sa.Column("mode", sa.String(length=20), nullable=False, server_default="shortest"),
    )
    op.drop_index("idx_game_results_user_challenge", table_name="game_results")
    op.create_index(
        "idx_game_results_user_challenge_mode",
        "game_results",
        ["user_id", "challenge_id", "mode"],
        unique=True,
        postgresql_where=sa.text("user_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("idx_game_results_user_challenge_mode", table_name="game_results")
    op.create_index(
        "idx_game_results_user_challenge",
        "game_results",
        ["user_id", "challenge_id"],
        unique=True,
        postgresql_where=sa.text("user_id IS NOT NULL"),
    )
    op.drop_column("game_results", "mode")
