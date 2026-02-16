"""Add home_country_code to profiles.

Revision ID: 0002
Revises: 0001
Create Date: 2026-02-16 00:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "profiles",
        sa.Column("home_country_code", sa.String(length=3), nullable=True),
    )
    op.create_foreign_key(
        "fk_profiles_home_country_code_countries",
        "profiles",
        "countries",
        ["home_country_code"],
        ["code"],
        ondelete="SET NULL",
    )
    op.create_index(
        "idx_profiles_home_country_code",
        "profiles",
        ["home_country_code"],
    )


def downgrade() -> None:
    op.drop_index("idx_profiles_home_country_code", table_name="profiles")
    op.drop_constraint(
        "fk_profiles_home_country_code_countries",
        "profiles",
        type_="foreignkey",
    )
    op.drop_column("profiles", "home_country_code")
