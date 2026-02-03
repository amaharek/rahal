"""Initial schema for Rahal database.

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')

    # Countries table
    op.create_table(
        'countries',
        sa.Column('id', sa.UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('code', sa.String(3), nullable=False),
        sa.Column('name_ar', sa.String(100), nullable=False),
        sa.Column('name_en', sa.String(100), nullable=False),
        sa.Column('name_ar_normalized', sa.String(100), nullable=False),
        sa.Column('continent', sa.String(50), nullable=True),
        sa.Column('region', sa.String(50), nullable=True),
        sa.Column('population', sa.BigInteger(), nullable=True),
        sa.Column('area_km2', sa.Integer(), nullable=True),
        sa.Column('capital_ar', sa.String(100), nullable=True),
        sa.Column('capital_en', sa.String(100), nullable=True),
        sa.Column('flag_emoji', sa.String(10), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index('idx_countries_code', 'countries', ['code'])
    op.create_index('idx_countries_continent', 'countries', ['continent'])
    op.create_index('idx_countries_region', 'countries', ['region'])
    op.execute('CREATE INDEX idx_countries_name_ar_trgm ON countries USING gin (name_ar gin_trgm_ops)')
    op.execute('CREATE INDEX idx_countries_name_ar_normalized_trgm ON countries USING gin (name_ar_normalized gin_trgm_ops)')

    # Borders table
    op.create_table(
        'borders',
        sa.Column('id', sa.UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('country_a_id', sa.UUID(), nullable=False),
        sa.Column('country_b_id', sa.UUID(), nullable=False),
        sa.Column('border_type', sa.String(20), server_default='land', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['country_a_id'], ['countries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['country_b_id'], ['countries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('country_a_id', 'country_b_id', name='borders_unique'),
        sa.CheckConstraint('country_a_id < country_b_id', name='borders_order'),
        sa.CheckConstraint("border_type IN ('land', 'maritime', 'both')", name='borders_type_check')
    )
    op.create_index('idx_borders_country_a', 'borders', ['country_a_id'])
    op.create_index('idx_borders_country_b', 'borders', ['country_b_id'])

    # Questions table
    op.create_table(
        'questions',
        sa.Column('id', sa.UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('difficulty', sa.String(20), nullable=False),
        sa.Column('question_type', sa.String(30), nullable=False),
        sa.Column('question_ar', sa.Text(), nullable=False),
        sa.Column('question_en', sa.Text(), nullable=True),
        sa.Column('correct_answer', sa.String(200), nullable=False),
        sa.Column('correct_answer_normalized', sa.String(200), nullable=False),
        sa.Column('options', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('hint', sa.Text(), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('country_id', sa.UUID(), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.Text()), server_default='{}', nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('times_shown', sa.Integer(), server_default='0', nullable=True),
        sa.Column('times_correct', sa.Integer(), server_default='0', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['country_id'], ['countries.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("difficulty IN ('easy', 'medium', 'hard')", name='questions_difficulty_check'),
        sa.CheckConstraint("question_type IN ('multiple_choice', 'autocomplete', 'true_false')", name='questions_type_check')
    )
    op.create_index('idx_questions_category', 'questions', ['category'])
    op.create_index('idx_questions_difficulty', 'questions', ['difficulty'])
    op.create_index('idx_questions_type', 'questions', ['question_type'])
    op.create_index('idx_questions_country', 'questions', ['country_id'])
    op.execute('CREATE INDEX idx_questions_active ON questions (is_active) WHERE is_active = TRUE')
    op.execute('CREATE INDEX idx_questions_tags ON questions USING gin (tags)')

    # Achievements table
    op.create_table(
        'achievements',
        sa.Column('id', sa.UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('code', sa.String(50), nullable=False),
        sa.Column('name_ar', sa.String(100), nullable=False),
        sa.Column('name_en', sa.String(100), nullable=False),
        sa.Column('description_ar', sa.Text(), nullable=True),
        sa.Column('description_en', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(10), nullable=True),
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('points', sa.Integer(), server_default='0', nullable=True),
        sa.Column('requirement', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index('idx_achievements_code', 'achievements', ['code'])
    op.create_index('idx_achievements_category', 'achievements', ['category'])

    # Profiles table
    op.create_table(
        'profiles',
        sa.Column('id', sa.UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('username', sa.String(50), nullable=True),
        sa.Column('display_name', sa.String(100), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('total_score', sa.Integer(), server_default='0', nullable=True),
        sa.Column('games_played', sa.Integer(), server_default='0', nullable=True),
        sa.Column('games_won', sa.Integer(), server_default='0', nullable=True),
        sa.Column('current_streak', sa.Integer(), server_default='0', nullable=True),
        sa.Column('longest_streak', sa.Integer(), server_default='0', nullable=True),
        sa.Column('last_played_date', sa.Date(), nullable=True),
        sa.Column('quiz_correct', sa.Integer(), server_default='0', nullable=True),
        sa.Column('quiz_total', sa.Integer(), server_default='0', nullable=True),
        sa.Column('preferences', postgresql.JSONB(astext_type=sa.Text()),
                  server_default='{"theme": "light", "language": "ar", "notifications": true}', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        sa.UniqueConstraint('username')
    )
    op.create_index('idx_profiles_user_id', 'profiles', ['user_id'])
    op.create_index('idx_profiles_username', 'profiles', ['username'])
    op.create_index('idx_profiles_total_score', 'profiles', [sa.text('total_score DESC')])
    op.create_index('idx_profiles_current_streak', 'profiles', [sa.text('current_streak DESC')])

    # User achievements table
    op.create_table(
        'user_achievements',
        sa.Column('id', sa.UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('profile_id', sa.UUID(), nullable=False),
        sa.Column('achievement_id', sa.UUID(), nullable=False),
        sa.Column('earned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['achievement_id'], ['achievements.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('profile_id', 'achievement_id', name='user_achievements_unique')
    )
    op.create_index('idx_user_achievements_profile', 'user_achievements', ['profile_id'])

    # Daily challenges table
    op.create_table(
        'daily_challenges',
        sa.Column('id', sa.UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('challenge_date', sa.Date(), nullable=False),
        sa.Column('start_country_id', sa.UUID(), nullable=False),
        sa.Column('end_country_id', sa.UUID(), nullable=False),
        sa.Column('shortest_path', sa.Integer(), nullable=False),
        sa.Column('hint_countries', postgresql.ARRAY(sa.UUID()), server_default='{}', nullable=True),
        sa.Column('difficulty', sa.String(20), server_default='medium', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['start_country_id'], ['countries.id']),
        sa.ForeignKeyConstraint(['end_country_id'], ['countries.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('challenge_date')
    )
    op.create_index('idx_daily_challenges_date', 'daily_challenges', [sa.text('challenge_date DESC')])

    # Game results table
    op.create_table(
        'game_results',
        sa.Column('id', sa.UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('profile_id', sa.UUID(), nullable=True),
        sa.Column('challenge_id', sa.UUID(), nullable=False),
        sa.Column('guesses', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('total_guesses', sa.Integer(), nullable=False),
        sa.Column('hints_used', sa.Integer(), server_default='0', nullable=True),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('completed', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['challenge_id'], ['daily_challenges.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_game_results_profile', 'game_results', ['profile_id'])
    op.create_index('idx_game_results_challenge', 'game_results', ['challenge_id'])
    op.create_index('idx_game_results_score', 'game_results', [sa.text('score DESC')])
    op.execute('CREATE UNIQUE INDEX idx_game_results_profile_challenge ON game_results (profile_id, challenge_id) WHERE profile_id IS NOT NULL')

    # Quiz results table
    op.create_table(
        'quiz_results',
        sa.Column('id', sa.UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('profile_id', sa.UUID(), nullable=True),
        sa.Column('session_id', sa.UUID(), nullable=False),
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('difficulty', sa.String(20), nullable=True),
        sa.Column('total_questions', sa.Integer(), nullable=False),
        sa.Column('correct_answers', sa.Integer(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('answers', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_quiz_results_profile', 'quiz_results', ['profile_id'])
    op.create_index('idx_quiz_results_session', 'quiz_results', ['session_id'])
    op.create_index('idx_quiz_results_category', 'quiz_results', ['category'])

    # Daily quizzes table
    op.create_table(
        'daily_quizzes',
        sa.Column('id', sa.UUID(), server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('quiz_date', sa.Date(), nullable=False),
        sa.Column('questions', postgresql.ARRAY(sa.UUID()), nullable=False),
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('quiz_date')
    )
    op.create_index('idx_daily_quizzes_date', 'daily_quizzes', [sa.text('quiz_date DESC')])

    # Create updated_at trigger function
    op.execute('''
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    ''')

    # Create triggers for updated_at
    for table in ['countries', 'questions', 'profiles', 'game_results']:
        op.execute(f'''
            CREATE TRIGGER update_{table}_updated_at
                BEFORE UPDATE ON {table}
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ''')


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('daily_quizzes')
    op.drop_table('quiz_results')
    op.drop_table('game_results')
    op.drop_table('daily_challenges')
    op.drop_table('user_achievements')
    op.drop_table('profiles')
    op.drop_table('achievements')
    op.drop_table('questions')
    op.drop_table('borders')
    op.drop_table('countries')

    # Drop trigger function
    op.execute('DROP FUNCTION IF EXISTS update_updated_at_column()')
