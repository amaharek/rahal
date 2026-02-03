# Product Requirements Document (PRD)
# رحال (Rahal) - Arabic Travel & Geography Game Platform

---

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | Draft |
| **Last Updated** | January 30, 2026 |
| **Product Owner** | TBD |
| **Engineering Lead** | TBD |
| **Stakeholders** | TBD |

### Version History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 30, 2026 | Product Team | Initial draft |

---

## 1. Overview (The "Why")

### Problem Statement
**What user pain are we solving?**

Arabic-speaking users lack a dedicated, culturally-relevant geography and travel education platform in their native language. Existing platforms like travle.earth are English-centric and don't cater to the Arabic-speaking market of 400+ million people.

**Evidence:**
- **Quantitative:** Arabic is the 5th most spoken language globally with 400M+ speakers, yet geography gaming platforms are predominantly English
- **Qualitative:** *"I wish there was a fun way to learn geography in Arabic for my children"* - Parent feedback from social media
- **Market Gap:** No major Arabic-first geography game platform exists

**Impact:**
- Arabic-speaking students lack engaging geography learning tools
- Arab travelers miss out on gamified travel education
- Educational institutions need Arabic educational games

### Solution (High-Level)
**Rahal (رحال)** - meaning "Traveler" in Arabic - is a fully Arabic geography and travel game platform that combines the engaging gameplay of travle.earth with educational quiz features about countries, landmarks, and cultural attractions. The platform features RTL (right-to-left) design, Arabic autocomplete, and content curated for Arab audiences.

### Strategic Alignment
- **Company Goal:** Become the leading Arabic educational entertainment platform
- **Why Now:** Growing demand for Arabic digital content, increased mobile/internet penetration in MENA region

---

## 2. Goals & Success Metrics

### Primary Success Metric
| Metric | Baseline | Target | Timeline |
|--------|----------|--------|----------|
| Daily Active Users (DAU) | 0 | 50,000 | 6 months post-launch |

### Secondary Metrics
| Metric | Target | Timeline |
|--------|--------|----------|
| User Retention (Day 7) | 40% | 3 months |
| Average Session Duration | 8 minutes | 3 months |
| Questions Answered/Day | 500,000 | 6 months |
| App Store Rating | 4.5+ stars | 6 months |

### Anti-Metrics (what we DON'T want to move)
- **Bounce Rate:** Must stay below 40%
- **Load Time:** Must stay under 3 seconds

---

## 3. Target Users

### Primary Persona: أحمد (Ahmed) - The Curious Learner
- **Who:** 16-30 years old, Arabic speaker, interested in geography and travel
- **Pain Points:**
  - *"Most geography games are in English and don't feel relevant to me"*
  - *"I want to learn about countries in a fun way, not just reading Wikipedia"*
- **Goal:** Learn geography interactively while having fun

**Job-to-be-Done:**
> When I have free time and want to learn something new, I want to play an engaging geography game in Arabic, so I can improve my knowledge while being entertained.

### Secondary Persona: سارة (Sara) - The Educator
- **Who:** 30-50 years old, teacher or parent, looking for educational tools
- **Pain Points:**
  - *"I need Arabic educational content for my students/children"*
  - *"Most educational games are boring or in English"*
- **Goal:** Find engaging Arabic educational content

### Tertiary Persona: خالد (Khaled) - The Competitive Gamer
- **Who:** 18-35 years old, enjoys daily puzzle games and competing
- **Pain Points:**
  - *"I play Wordle and similar games but want more variety"*
  - *"I want to challenge my friends in geography knowledge"*
- **Goal:** Daily challenge and social competition

---

## 4. MVP Definition

### Core Problem (One Sentence)
Arabic speakers need an engaging, culturally-relevant geography game platform in their native language.

### MVP Features (5 Core Features)

#### 1. لعبة المسار (Path Game) - Core Travel Game
- **Why essential:** Primary gameplay loop, same as travle.earth but in Arabic
- **Acceptance Criteria:**
  - [ ] Daily puzzle: Start country → Destination country
  - [ ] Arabic country names with autocomplete
  - [ ] Emoji feedback system for guess quality
  - [ ] Streak tracking and statistics
  - [ ] Share results in Arabic

#### 2. أسئلة اختيار متعدد (Multiple Choice Quiz)
- **Why essential:** Educational differentiation from travle.earth
- **Acceptance Criteria:**
  - [ ] Questions about countries (capitals, flags, populations)
  - [ ] Questions about landmarks and attractions
  - [ ] Questions about geographic locations
  - [ ] Difficulty levels (easy, medium, hard)
  - [ ] Daily quiz challenges

#### 3. أسئلة الإكمال التلقائي (Autocomplete Quiz)
- **Why essential:** Tests deeper knowledge without multiple choice hints
- **Acceptance Criteria:**
  - [ ] Arabic autocomplete with fuzzy matching
  - [ ] Categories: Countries, Capitals, Landmarks, Attractions
  - [ ] Hint system (letter reveals)
  - [ ] Scoring based on hints used

#### 4. واجهة عربية كاملة (Full Arabic Interface)
- **Why essential:** Core differentiator and market need
- **Acceptance Criteria:**
  - [ ] RTL (right-to-left) layout throughout
  - [ ] Arabic typography optimized for readability
  - [ ] Culturally appropriate design elements
  - [ ] Arabic error messages and tooltips

#### 5. نظام الإنجازات والتتبع (Achievement & Tracking System)
- **Why essential:** Engagement and retention
- **Acceptance Criteria:**
  - [ ] Daily streaks
  - [ ] Achievement badges
  - [ ] Progress statistics
  - [ ] Leaderboards

### What's NOT in MVP
- ❌ **Mobile App** - *Why:* Web-first approach, PWA for mobile
- ❌ **Multiplayer Real-time** - *Why:* Complexity, V2 feature
- ❌ **User-generated Content** - *Why:* Quality control needed first
- ❌ **Premium Subscription** - *Why:* Build user base first

### MVP Success Criteria
- **Quantitative:** 10,000 DAU within 3 months
- **Qualitative:** 8/10 users rate experience as "enjoyable" or better

---

## 5. User Stories & Flows

### Core User Flow - Daily Path Game

```
┌─────────────────┐
│  Open Rahal     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ View Daily      │
│ Challenge       │
│ (Start → End)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Type Country    │◄──────────────┐
│ (Autocomplete)  │               │
└────────┬────────┘               │
         │                        │
         ▼                        │
┌─────────────────┐               │
│ View Feedback   │               │
│ (Emoji Score)   │               │
└────────┬────────┘               │
         │                        │
         ▼                        │
    ┌────┴────┐                   │
    │Reached  │                   │
    │Target?  │───No──────────────┘
    └────┬────┘
         │Yes
         ▼
┌─────────────────┐
│ View Results    │
│ Share Score     │
└─────────────────┘
```

### Key User Stories

**US-001: Daily Path Challenge**
> As a player, I want to complete a daily geography path challenge so that I can test my knowledge and maintain my streak.

**Priority:** Must Have

**Acceptance Criteria:**
- Given I open the app, when I view the daily challenge, then I see start and destination countries in Arabic
- Given I type a country name, when I use Arabic input, then I see autocomplete suggestions
- Given I submit a guess, when it's processed, then I see emoji feedback indicating quality

---

**US-002: Multiple Choice Quiz**
> As a learner, I want to answer multiple choice questions about countries and landmarks so that I can learn geography facts.

**Priority:** Must Have

**Acceptance Criteria:**
- Given I start a quiz, when questions appear, then I see 4 Arabic answer options
- Given I answer correctly, when I proceed, then I see my score increase
- Given I answer incorrectly, when I see the result, then I learn the correct answer

---

**US-003: Autocomplete Challenge**
> As an advanced player, I want to answer questions by typing with autocomplete so that I can test deeper knowledge.

**Priority:** Must Have

**Acceptance Criteria:**
- Given I start an autocomplete quiz, when I type in Arabic, then relevant suggestions appear
- Given I need help, when I use a hint, then a letter is revealed
- Given I answer, when scored, then fewer hints = higher score

---

**US-004: View Statistics**
> As a regular player, I want to view my gameplay statistics so that I can track my progress.

**Priority:** Should Have

**Acceptance Criteria:**
- Given I open statistics, when I view my data, then I see games played, win rate, and streaks
- Given I have achievements, when I view them, then I see earned badges

---

## 6. Feature Specifications

### Feature Priority

| Feature | Priority | User Value | Effort | Release |
|---------|----------|------------|--------|---------|
| Path Game (لعبة المسار) | Must Have | High | High | MVP |
| Arabic Autocomplete | Must Have | High | Medium | MVP |
| Multiple Choice Quiz | Must Have | High | Medium | MVP |
| Autocomplete Quiz | Must Have | Medium | Medium | MVP |
| Streak & Stats | Must Have | Medium | Low | MVP |
| Achievements | Should Have | Medium | Medium | V1.1 |
| Leaderboards | Should Have | Medium | Medium | V1.1 |
| Practice Mode | Should Have | Medium | Low | V1.1 |
| Hard Mode | Could Have | Low | Low | V1.2 |
| Weekly Challenge | Could Have | Medium | Medium | V1.2 |

---

### Detailed Specs

#### Feature 1: لعبة المسار (Path Game)

**Description:** Daily geography puzzle where players navigate from a start country to a destination country by naming intermediate countries. Players aim to find the shortest path (fewest countries).

**Game Rules:**
- Countries connect via land borders, major bridges, and tunnels
- Exclaves don't count (e.g., Ceuta doesn't connect Spain to Morocco)
- Special connections: Egypt-Saudi Arabia (bridge planned), Ireland-UK

**Emoji Feedback System:**
| Emoji | Meaning (Arabic) | Criteria |
|-------|------------------|----------|
| 🟢 | ممتاز (Excellent) | On shortest path, correct order |
| 🟡 | جيد (Good) | On shortest path, wrong order |
| 🟠 | مقبول (Acceptable) | Close to shortest path |
| 🔴 | بعيد (Far) | Significant detour |
| ⚫ | قارة مختلفة (Different continent) | Wrong landmass |

**Hint System (3 hints available):**
1. **تلميح الحدود** - Show border outline of one country on path
2. **تلميح جميع الحدود** - Show all countries on shortest path
3. **تلميح الحروف الأولى** - Show first letter of countries on path

---

#### Feature 2: نظام الأسئلة (Quiz System)

**Description:** Educational quiz system with two modes - multiple choice and autocomplete - covering countries, landmarks, and attractions.

**Question Categories:**

| Category | Arabic | Example Questions |
|----------|--------|-------------------|
| Capitals | العواصم | ما هي عاصمة اليابان؟ |
| Flags | الأعلام | لأي دولة ينتمي هذا العلم؟ |
| Landmarks | المعالم | أين يقع برج إيفل؟ |
| Attractions | معالم الجذب | في أي مدينة توجد ساعة بيج بن؟ |
| Geography | الجغرافيا | ما هو أطول نهر في العالم؟ |
| Borders | الحدود | ما هي الدول التي تحد فرنسا؟ |
| Population | السكان | أي دولة أكبر سكانياً؟ |
| Arab World | العالم العربي | ما هي أكبر دولة عربية مساحة؟ |

**Multiple Choice Mode:**
- 4 answer options displayed
- 10 questions per session
- Timer optional (30 seconds default)
- Score: 10 points per correct answer

**Autocomplete Mode:**
- Arabic fuzzy search autocomplete
- Hints available (reduce score)
- Score: 15 points - (3 × hints used)

---

#### Feature 3: نظام الإكمال التلقائي العربي (Arabic Autocomplete System)

**Description:** Intelligent Arabic text input with autocomplete supporting fuzzy matching, handling Arabic script variations.

**Technical Requirements:**
- Support for Arabic diacritics (تشكيل)
- Handle Hamza variations (أ، إ، آ، ء)
- Support common transliterations
- Fuzzy matching for typos
- Show confidence scores

**Example:**
```
Input: "مص"
Suggestions:
  - مصر (Egypt) ★★★
  - مسقط (Muscat) ★★
```

---

## 7. Requirements

### Functional Requirements (FR)

| ID | Requirement | Priority | Acceptance Test |
|----|-------------|----------|-----------------|
| FR-001 | System displays daily start/end countries in Arabic | Must Have | Arabic text renders correctly RTL |
| FR-002 | Autocomplete shows Arabic country suggestions | Must Have | Type "سع" → shows "السعودية" |
| FR-003 | System calculates shortest path between countries | Must Have | Path algorithm verified against test cases |
| FR-004 | Multiple choice shows 4 Arabic options | Must Have | All 4 options display correctly |
| FR-005 | User streak persists across sessions | Must Have | Close app, reopen, streak maintained |
| FR-006 | Results shareable in Arabic format | Must Have | Share generates Arabic text/image |
| FR-007 | Hints reduce available count | Must Have | Use hint → count decreases |
| FR-008 | Statistics track all gameplay | Should Have | Games played, win %, streaks shown |

### Non-Functional Requirements (NFR)

| Category | Requirement | Target | Measurement |
|----------|-------------|--------|-------------|
| **Performance** | Page load time | <2 sec | Lighthouse |
| **Performance** | Autocomplete response | <100ms | Performance monitoring |
| **Scalability** | Concurrent users | 50,000 | Load testing |
| **Security** | Data encryption | TLS 1.3 | Security audit |
| **Accessibility** | Screen reader support | Full Arabic | Manual testing |
| **Reliability** | Uptime | 99.5% | Monitoring |
| **Localization** | RTL Support | 100% | Visual QA |

---

## 8. Design & UX

### Design Principles
1. **Arabic-First:** Every design decision considers Arabic as primary language
2. **Clean & Modern:** Minimalist design that focuses on gameplay
3. **Educational:** Visual learning aids without being childish
4. **Celebratory:** Satisfying feedback for achievements

### RTL Design Considerations
- Navigation flows right-to-left
- Text alignment starts from right
- Icons mirrored where appropriate
- Progress bars fill right-to-left

### Color Scheme
| Purpose | Color | Hex |
|---------|-------|-----|
| Primary | Deep Teal | #0D7377 |
| Secondary | Sand Gold | #D4A574 |
| Success | Emerald | #2ECC71 |
| Warning | Amber | #F39C12 |
| Error | Coral | #E74C3C |
| Background | Off-White | #FAFAFA |

### Typography
- **Primary Font:** IBM Plex Sans Arabic
- **Headings:** Bold, 24-32px
- **Body:** Regular, 16-18px
- **UI Elements:** Medium, 14-16px

### Key Screens
1. **الصفحة الرئيسية (Home)** - Daily challenge preview, quick stats
2. **لعبة المسار (Path Game)** - Map, input, guess history
3. **الأسئلة (Quiz)** - Question display, answer options
4. **الإحصائيات (Statistics)** - Charts, achievements
5. **الإعدادات (Settings)** - Preferences, account

---

## 9. Out of Scope (MVP)

| Feature | Reason | Future? |
|---------|--------|---------|
| ❌ Native Mobile Apps | Web-first with PWA | V2.0 |
| ❌ Real-time Multiplayer | Technical complexity | V2.0 |
| ❌ User-generated Questions | Quality control needed | V1.5 |
| ❌ Premium/Subscription | Build free user base first | V1.5 |
| ❌ Social Features (friends) | Core gameplay first | V1.5 |
| ❌ Voice Input | Complexity | V2.0 |
| ❌ Offline Mode | PWA basics only | V1.5 |

---

## 10. Content Requirements

### Country Database
- **197 countries** with Arabic names (official UN list)
- Alternative spellings/names
- Border connections mapped
- Geographic data (continent, region, population, area)

### Question Database (MVP Target: 5,000 questions)

| Category | Questions Count | Difficulty Mix |
|----------|-----------------|----------------|
| Capitals | 500 | 60% easy, 30% medium, 10% hard |
| Flags | 400 | 50% easy, 35% medium, 15% hard |
| Landmarks | 800 | 40% easy, 40% medium, 20% hard |
| Attractions | 1000 | 40% easy, 40% medium, 20% hard |
| Geography Facts | 800 | 30% easy, 45% medium, 25% hard |
| Arab World Special | 500 | 50% easy, 35% medium, 15% hard |
| Borders | 500 | 40% easy, 40% medium, 20% hard |
| Miscellaneous | 500 | 40% easy, 40% medium, 20% hard |

### Landmark & Attraction Categories
- UNESCO World Heritage Sites
- Natural Wonders
- Religious Sites
- Modern Architecture
- Historical Monuments
- Museums
- Parks & Gardens
- Iconic Buildings

---

## 11. Brainstormed Features (Future Roadmap)

### V1.1 - Engagement Features
| Feature | Description | Value |
|---------|-------------|-------|
| **Practice Mode** | Unlimited play, choose continents | Learn without pressure |
| **Hard Mode** | No country names on map | Challenge advanced users |
| **Achievements** | 50+ badges to earn | Gamification |
| **Leaderboards** | Daily, weekly, all-time | Competition |

### V1.5 - Social & Expansion
| Feature | Description | Value |
|---------|-------------|-------|
| **Friends System** | Add friends, compare stats | Social engagement |
| **Challenge Friends** | Send custom challenges | Viral growth |
| **Arabic Dialects** | Egyptian, Levantine, Gulf options | Cultural relevance |
| **Premium Tier** | Ad-free, archive access, custom themes | Revenue |

### V2.0 - Platform Evolution
| Feature | Description | Value |
|---------|-------------|-------|
| **Native Apps** | iOS and Android | Better experience |
| **Voice Input** | Answer by speaking Arabic | Accessibility |
| **AR Mode** | Point camera at map for info | Innovation |
| **Classroom Mode** | Teacher dashboard, class competition | B2B opportunity |
| **Live Tournaments** | Real-time competitions | Engagement |

### Innovative Feature Ideas

#### 1. رحلة افتراضية (Virtual Journey)
- Plan a virtual trip across countries
- Learn about each country as you "travel"
- Collect stamps in a virtual passport
- See famous dishes, traditions, and phrases for each country

#### 2. تحدي المعالم (Landmark Challenge)
- Show image of landmark
- Player guesses country and city
- Zoom levels as hints
- Street View integration

#### 3. الرحال الصغير (Little Traveler) - Kids Mode
- Simplified interface
- Animated characters
- Voice narration
- Age-appropriate questions
- Parental controls

#### 4. مسابقة رمضان (Ramadan Challenge)
- Special 30-day challenge during Ramadan
- Questions about Islamic landmarks
- Cultural content
- Special rewards

#### 5. تعلم بالصور (Learn by Images)
- Visual quiz: identify country by photo
- Landscapes, food, traditional clothing
- Architecture recognition
- Flag components

#### 6. الاتصالات الثقافية (Cultural Connections)
- Match countries to their:
  - Traditional foods
  - National anthems (audio)
  - Languages
  - Currencies
  - Famous people

#### 7. خريطة تفاعلية (Interactive Map Mode)
- Explore world map
- Tap countries for facts
- Quiz mode on any country
- "Did you know?" popups

#### 8. تحدي السرعة (Speed Challenge)
- Answer as many questions as possible in 60 seconds
- Categories: capitals, flags, landmarks
- Daily high scores
- Multiplier combos

#### 9. رحال المدن (City Explorer)
- Focus on major cities
- Questions about neighborhoods, landmarks
- "Where in the city?" challenges
- Walking distance quizzes

#### 10. التاريخ والجغرافيا (History & Geography)
- Historical borders quiz
- "What country was this in 1900?"
- Empire expansions
- Historical trade routes

---

## 12. Technical Architecture (High-Level)

### Technology Stack
| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | Next.js 15 + React 19 | SSR, i18n support, modern |
| Styling | Tailwind CSS + RTL plugin | Fast, RTL native support |
| State | Zustand | Simple, performant |
| Backend | **FastAPI (Python)** | Easy to learn, async support, great docs |
| ORM | **SQLAlchemy 2.0** | Powerful ORM, async support, type hints |
| Migrations | **Alembic** | Database version control, auto-generation |
| Database | **Supabase** | PostgreSQL + Auth + Realtime + Storage |
| Package Manager | **uv** | Fast Python package manager (Rust-based) |
| CMS | **Strapi** | Headless CMS for content management |
| Local Dev | Docker Compose | Consistent across Mac/Windows |
| Hosting (Later) | Vercel (FE) + Railway/Render (BE) | Easy deployment |
| CDN | Cloudflare | Global, MENA presence |

### Why This Stack?

**FastAPI Benefits:**
- Python is beginner-friendly and widely used
- Built-in async/await support for high performance
- Automatic OpenAPI/Swagger documentation
- Pydantic for data validation
- Large ecosystem for Arabic text processing (e.g., `arabic-reshaper`, `python-bidi`)

**SQLAlchemy + Alembic Benefits:**
- SQLAlchemy 2.0 with async support for non-blocking DB operations
- Type-safe ORM with Python type hints
- Alembic handles schema migrations with version control
- Auto-generate migrations from model changes
- Easy rollback and upgrade paths
- Works seamlessly with Supabase PostgreSQL

**Strapi CMS Benefits:**
- Open-source headless CMS with admin UI out of the box
- Content types: Questions, Countries, Landmarks, Attractions
- Built-in media library for images (flags, landmarks)
- User roles & permissions (admin, editor, viewer)
- REST & GraphQL APIs auto-generated
- Internationalization (i18n) plugin for Arabic content
- Bulk import/export via plugins
- No custom admin panel code needed

**Supabase Benefits:**
- PostgreSQL database with a nice UI
- Built-in authentication (email, social, magic links)
- Real-time subscriptions (for future leaderboards)
- Storage for images/assets
- Row Level Security (RLS)
- Free tier generous for development
- Can run locally with Docker

### Project Structure
```
rahal/
├── frontend/                 # Next.js frontend (User-facing)
│   ├── app/                  # App router pages
│   │   ├── [locale]/         # i18n routes (ar, en)
│   │   ├── game/             # Path game pages
│   │   ├── quiz/             # Quiz pages
│   │   └── profile/          # User profile
│   ├── components/           # React components
│   ├── lib/                  # Utilities & Supabase client
│   ├── public/               # Static assets
│   └── package.json
│
├── cms/                      # Strapi CMS
│   ├── src/
│   │   ├── api/              # Content type APIs
│   │   │   ├── question/     # Question content type
│   │   │   ├── country/      # Country content type
│   │   │   ├── landmark/     # Landmark content type
│   │   │   ├── border/       # Border content type
│   │   │   └── challenge/    # Daily challenge content type
│   │   ├── components/       # Reusable components
│   │   └── plugins/          # Custom plugins
│   ├── config/               # Strapi configuration
│   │   ├── database.js       # PostgreSQL connection
│   │   ├── plugins.js        # Plugin config
│   │   └── server.js         # Server config
│   ├── public/               # Static assets
│   └── package.json
│
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app entry
│   │   ├── routers/          # API routes
│   │   │   ├── game.py       # Path game endpoints
│   │   │   ├── quiz.py       # Quiz endpoints
│   │   │   ├── users.py      # User endpoints
│   │   │   └── admin.py      # Admin/CMS endpoints
│   │   ├── models/           # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── base.py       # Base model class
│   │   │   ├── country.py    # Country & Border models
│   │   │   ├── question.py   # Question model
│   │   │   ├── challenge.py  # Daily challenge model
│   │   │   ├── user.py       # User profile model
│   │   │   └── game.py       # Game & quiz result models
│   │   ├── schemas/          # Pydantic schemas (request/response)
│   │   │   ├── country.py
│   │   │   ├── question.py
│   │   │   ├── game.py
│   │   │   └── user.py
│   │   ├── services/         # Business logic
│   │   │   ├── path_finder.py
│   │   │   ├── quiz_engine.py
│   │   │   └── challenge_generator.py
│   │   ├── crud/             # Database CRUD operations
│   │   │   ├── country.py
│   │   │   ├── question.py
│   │   │   └── user.py
│   │   ├── core/             # Config, dependencies
│   │   │   ├── config.py     # Settings & env vars
│   │   │   ├── database.py   # SQLAlchemy async engine
│   │   │   ├── security.py   # Auth helpers
│   │   │   └── deps.py       # FastAPI dependencies
│   │   └── utils/            # Utilities
│   │       └── arabic.py     # Arabic text processing
│   ├── alembic/              # Alembic migrations
│   │   ├── versions/         # Migration files
│   │   ├── env.py            # Alembic environment
│   │   └── script.py.mako    # Migration template
│   ├── alembic.ini           # Alembic config
│   ├── pyproject.toml        # Python dependencies (uv)
│   ├── uv.lock               # Lock file
│   └── Dockerfile
│
├── supabase/                 # Supabase local config
│   ├── config.toml
│   └── seed.sql              # Initial seed data (optional)
│
├── scripts/                  # Utility scripts
│   ├── seed_countries.py     # Populate countries & borders
│   ├── seed_questions.py     # Import questions from CSV/JSON
│   └── generate_challenge.py # Generate daily challenges
│
├── data/                     # Static data files
│   ├── countries.json        # Country data with Arabic names
│   ├── borders.json          # Border connections
│   └── questions/            # Question bank CSVs
│       ├── capitals.csv
│       ├── flags.csv
│       └── landmarks.csv
│
├── docker-compose.yml        # Local development setup
├── .env.example              # Environment variables template
└── README.md
```

### Local Development Setup

#### Prerequisites
- **Mac:** Homebrew, Docker Desktop, Node.js 20+, Python 3.11+, uv (Python package manager)
- **Windows:** WSL2, Docker Desktop, Node.js 20+, Python 3.11+, uv (Python package manager)

#### Install uv (Fast Python Package Manager)
```bash
# Mac/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

#### Quick Start (Both Mac & Windows)
```bash
# 1. Clone the repository
git clone https://github.com/your-org/rahal.git
cd rahal

# 2. Copy environment variables
cp .env.example .env

# 3. Start Supabase locally (runs PostgreSQL, Auth, etc.)
npx supabase start
# Note the DB URL output, add to .env as DATABASE_URL

# 4. Start the backend (FastAPI)
cd backend
uv sync                   # Create venv & install dependencies from pyproject.toml
source .venv/bin/activate # Windows: .venv\Scripts\activate

# 5. Run Alembic migrations
alembic upgrade head

# 6. Seed initial data (countries, sample questions)
python ../scripts/seed_countries.py
python ../scripts/seed_questions.py

# 7. Start FastAPI server
uvicorn app.main:app --reload --port 8000

# 8. Start the frontend (Next.js) - in another terminal
cd frontend
npm install
npm run dev

# 9. Start Strapi CMS - in another terminal
cd cms
npm install
npm run develop

# 10. Access the apps:
#     - Frontend: http://localhost:3000
#     - Strapi CMS: http://localhost:1337/admin
#     - Strapi API: http://localhost:1337/api
#     - FastAPI Docs: http://localhost:8000/docs
```

#### Alembic Migration Commands
```bash
cd backend

# Create a new migration (after changing SQLAlchemy models)
alembic revision --autogenerate -m "Add new field to questions"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history

# View current revision
alembic current
```

#### Docker Compose (Alternative - Recommended)
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Supabase runs separately via CLI (npx supabase start)

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - STRAPI_URL=http://cms:1337
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    depends_on:
      - cms

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_KEY}
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

  cms:
    build: ./cms
    ports:
      - "1337:1337"
    environment:
      - DATABASE_CLIENT=postgres
      - DATABASE_URL=${DATABASE_URL}
      - STRAPI_ADMIN_BACKEND_URL=http://localhost:1337
    volumes:
      - ./cms:/app
      - /app/node_modules
    command: npm run develop
```

```bash
# Start everything
docker-compose up

# Stop everything
docker-compose down

# View logs for specific service
docker-compose logs -f backend
```

### Database Schema (Supabase/PostgreSQL)

```sql
-- Countries table
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(3) UNIQUE NOT NULL,        -- ISO 3166-1 alpha-3
  name_ar VARCHAR(100) NOT NULL,          -- Arabic name
  name_en VARCHAR(100) NOT NULL,          -- English name
  continent VARCHAR(50),
  region VARCHAR(100),
  population BIGINT,
  area_km2 DECIMAL,
  capital_ar VARCHAR(100),
  capital_en VARCHAR(100),
  flag_emoji VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Country borders (graph edges)
CREATE TABLE borders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_a UUID REFERENCES countries(id),
  country_b UUID REFERENCES countries(id),
  border_type VARCHAR(50) DEFAULT 'land',  -- land, bridge, tunnel
  UNIQUE(country_a, country_b)
);

-- Daily challenges
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE UNIQUE NOT NULL,
  start_country UUID REFERENCES countries(id),
  end_country UUID REFERENCES countries(id),
  shortest_path INTEGER NOT NULL,          -- Minimum countries needed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,           -- capitals, flags, landmarks, etc.
  difficulty VARCHAR(20) NOT NULL,         -- easy, medium, hard
  question_type VARCHAR(30) NOT NULL,      -- multiple_choice, autocomplete
  question_ar TEXT NOT NULL,               -- Question in Arabic
  correct_answer TEXT NOT NULL,
  options JSONB,                           -- For multiple choice
  hint TEXT,
  image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game results
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  challenge_id UUID REFERENCES daily_challenges(id),
  guesses JSONB NOT NULL,                  -- Array of guesses with scores
  total_guesses INTEGER NOT NULL,
  hints_used INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  score INTEGER,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Quiz results
CREATE TABLE quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  question_id UUID REFERENCES questions(id),
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  hints_used INTEGER DEFAULT 0,
  time_taken_ms INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  icon VARCHAR(50),
  requirement JSONB                        -- Criteria to unlock
);

-- User achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### API Endpoints (FastAPI)

#### Game Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/game/daily` | Get today's challenge |
| POST | `/api/game/guess` | Submit a country guess |
| GET | `/api/game/hint` | Use a hint |
| POST | `/api/game/complete` | Mark game as complete |
| GET | `/api/game/stats` | Get user's game statistics |

#### Quiz Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quiz/question` | Get a random question |
| GET | `/api/quiz/question/{category}` | Get question by category |
| POST | `/api/quiz/answer` | Submit an answer |
| GET | `/api/quiz/daily` | Get daily quiz challenge |
| GET | `/api/quiz/stats` | Get user's quiz statistics |

#### Autocomplete Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/autocomplete/countries?q=` | Search countries in Arabic |
| GET | `/api/autocomplete/landmarks?q=` | Search landmarks in Arabic |
| GET | `/api/autocomplete/cities?q=` | Search cities in Arabic |

#### User Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update profile |
| GET | `/api/users/achievements` | Get user achievements |
| GET | `/api/users/leaderboard` | Get leaderboard |

### Strapi CMS Content Types

Strapi will manage all content that needs to be editable by non-developers.

#### Content Types

| Content Type | Fields | Purpose |
|--------------|--------|---------|
| **Question** | category, difficulty, question_type, question_ar, correct_answer, options (JSON), hint, image, tags | Quiz questions |
| **Country** | code, name_ar, name_en, continent, region, population, area_km2, capital_ar, capital_en, flag_emoji, flag_image | Country data |
| **Border** | country_a (relation), country_b (relation), border_type | Country connections |
| **Landmark** | name_ar, name_en, description_ar, country (relation), city, image, category, coordinates | Tourist attractions |
| **DailyChallenge** | challenge_date, start_country (relation), end_country (relation), shortest_path | Pre-scheduled challenges |

#### Strapi Admin Workflow
1. **Content Editors** add/edit questions, landmarks via Strapi admin UI
2. **Data Sync** - Cron job syncs Strapi content to Supabase (or use Strapi as primary DB)
3. **Media** - Images stored in Strapi media library (can use Cloudinary provider)

#### Option A: Strapi as Content Source (Recommended)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Strapi    │────►│   FastAPI   │────►│   Frontend  │
│  (Content)  │     │  (Game API) │     │  (Next.js)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────────────────────────────┐
│         Supabase (PostgreSQL)        │
│    - User data, game results, auth   │
└─────────────────────────────────────┘
```

- Strapi manages: Questions, Countries, Landmarks (content)
- Supabase manages: Users, Game Results, Achievements (user data)
- FastAPI: Reads from both, handles game logic

#### Option B: Strapi for Editing, Sync to Supabase
- Edit content in Strapi
- Webhook/cron syncs to Supabase
- FastAPI reads only from Supabase

### SQLAlchemy Models

```python
# backend/app/models/base.py
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from datetime import datetime
import uuid

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
```

```python
# backend/app/models/country.py
from sqlalchemy import String, BigInteger, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import Base, TimestampMixin
import uuid

class Country(Base, TimestampMixin):
    __tablename__ = "countries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(3), unique=True, nullable=False)
    name_ar: Mapped[str] = mapped_column(String(100), nullable=False)
    name_en: Mapped[str] = mapped_column(String(100), nullable=False)
    continent: Mapped[str | None] = mapped_column(String(50))
    region: Mapped[str | None] = mapped_column(String(100))
    population: Mapped[int | None] = mapped_column(BigInteger)
    area_km2: Mapped[float | None] = mapped_column(Numeric)
    capital_ar: Mapped[str | None] = mapped_column(String(100))
    capital_en: Mapped[str | None] = mapped_column(String(100))
    flag_emoji: Mapped[str | None] = mapped_column(String(10))

    # Relationships
    borders_from: Mapped[list["Border"]] = relationship(
        "Border", foreign_keys="Border.country_a_id", back_populates="country_a"
    )
    borders_to: Mapped[list["Border"]] = relationship(
        "Border", foreign_keys="Border.country_b_id", back_populates="country_b"
    )


class Border(Base):
    __tablename__ = "borders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country_a_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("countries.id"))
    country_b_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("countries.id"))
    border_type: Mapped[str] = mapped_column(String(50), default="land")

    # Relationships
    country_a: Mapped["Country"] = relationship("Country", foreign_keys=[country_a_id])
    country_b: Mapped["Country"] = relationship("Country", foreign_keys=[country_b_id])
```

```python
# backend/app/models/question.py
from sqlalchemy import String, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from .base import Base, TimestampMixin
import uuid
import enum

class QuestionCategory(str, enum.Enum):
    CAPITALS = "capitals"
    FLAGS = "flags"
    LANDMARKS = "landmarks"
    ATTRACTIONS = "attractions"
    GEOGRAPHY = "geography"
    BORDERS = "borders"
    POPULATION = "population"
    ARAB_WORLD = "arab_world"

class QuestionDifficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class QuestionType(str, enum.Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    AUTOCOMPLETE = "autocomplete"

class Question(Base, TimestampMixin):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category: Mapped[QuestionCategory] = mapped_column(Enum(QuestionCategory), nullable=False)
    difficulty: Mapped[QuestionDifficulty] = mapped_column(Enum(QuestionDifficulty), nullable=False)
    question_type: Mapped[QuestionType] = mapped_column(Enum(QuestionType), nullable=False)
    question_ar: Mapped[str] = mapped_column(Text, nullable=False)
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[dict | None] = mapped_column(JSONB)  # For multiple choice
    hint: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(Text)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String))
```

```python
# backend/app/models/user.py
from sqlalchemy import String, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import Base, TimestampMixin
import uuid

class Profile(Base, TimestampMixin):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)  # Links to auth.users
    username: Mapped[str | None] = mapped_column(String(50), unique=True)
    display_name: Mapped[str | None] = mapped_column(String(100))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    max_streak: Mapped[int] = mapped_column(Integer, default=0)
    games_played: Mapped[int] = mapped_column(Integer, default=0)
    games_won: Mapped[int] = mapped_column(Integer, default=0)
    total_questions_answered: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    game_results: Mapped[list["GameResult"]] = relationship(back_populates="user")
    quiz_results: Mapped[list["QuizResult"]] = relationship(back_populates="user")
```

```python
# backend/app/models/game.py
from sqlalchemy import Integer, Boolean, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import Base, TimestampMixin
import uuid
from datetime import date

class DailyChallenge(Base, TimestampMixin):
    __tablename__ = "daily_challenges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenge_date: Mapped[date] = mapped_column(Date, unique=True, nullable=False)
    start_country_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("countries.id"))
    end_country_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("countries.id"))
    shortest_path: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    start_country: Mapped["Country"] = relationship(foreign_keys=[start_country_id])
    end_country: Mapped["Country"] = relationship(foreign_keys=[end_country_id])
    game_results: Mapped[list["GameResult"]] = relationship(back_populates="challenge")


class GameResult(Base, TimestampMixin):
    __tablename__ = "game_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id"))
    challenge_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("daily_challenges.id"))
    guesses: Mapped[dict] = mapped_column(JSONB, nullable=False)
    total_guesses: Mapped[int] = mapped_column(Integer, nullable=False)
    hints_used: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    score: Mapped[int | None] = mapped_column(Integer)

    # Relationships
    user: Mapped["Profile"] = relationship(back_populates="game_results")
    challenge: Mapped["DailyChallenge"] = relationship(back_populates="game_results")


class QuizResult(Base, TimestampMixin):
    __tablename__ = "quiz_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id"))
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("questions.id"))
    user_answer: Mapped[str] = mapped_column(String(500), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    hints_used: Mapped[int] = mapped_column(Integer, default=0)
    time_taken_ms: Mapped[int | None] = mapped_column(Integer)

    # Relationships
    user: Mapped["Profile"] = relationship(back_populates="quiz_results")
    question: Mapped["Question"] = relationship()
```

### Key Technical Considerations
1. **Arabic Text Processing**
   - Unicode normalization (NFKC)
   - Diacritic handling (strip tashkeel for search)
   - Bidirectional text support
   - Use `arabic-reshaper` and `python-bidi` for text processing

2. **Path Algorithm**
   - Pre-computed shortest paths using Floyd-Warshall or BFS
   - Store paths in database or cache
   - Daily puzzle generation via cron job

3. **Performance**
   - Supabase edge functions for low latency
   - Redis caching via Upstash (optional)
   - Autocomplete with client-side filtering + server fallback
   - Progressive image loading

4. **Deployment Strategy (Later Phase)**
   - **Frontend:** Vercel (automatic from GitHub)
   - **Backend (FastAPI):** Railway or Render (Docker deploy)
   - **CMS (Strapi):** Railway or Render (separate service)
   - **Database:** Supabase Cloud (free tier → paid)
   - **Domain:** Custom domain with Cloudflare DNS

---

## 13. Assumptions & Dependencies

### Assumptions
- [ ] Arabic speakers prefer native language gaming - *Risk if false:* Low adoption
- [ ] Geography games have market in MENA - *Risk if false:* Pivot to educational focus
- [ ] Web-first is acceptable for MVP - *Risk if false:* Need native apps sooner

### External Dependencies

| Dependency | Owner | Status | Impact if Blocked |
|------------|-------|--------|-------------------|
| Country border data | OpenStreetMap | Available | High - need alternative source |
| Arabic font licensing | IBM/Google | Available | Low - alternatives exist |
| Map tiles | MapTiler/Mapbox | Available | Medium - cost consideration |
| Image hosting | Cloudinary | Available | Low - many alternatives |

---

## 14. Constraints

**Technical:**
- Must support RTL throughout
- Must work on Arabic keyboard layouts
- Must handle Arabic Unicode properly

**Business:**
- MVP budget: Limited (startup phase)
- Launch target: 3-4 months
- Small initial team

**Regulatory:**
- GDPR compliance for EU users
- Local data laws for MENA users
- Age-appropriate content guidelines

---

## 15. Timeline & Milestones

### Key Dates (Estimated)

| Milestone | Owner | Target | Status |
|-----------|-------|--------|--------|
| PRD Approval | Product | Week 1 | 🟡 In Progress |
| Design System | Design | Week 3 | 🔴 Not Started |
| Core Game Engine | Engineering | Week 6 | 🔴 Not Started |
| Quiz System | Engineering | Week 8 | 🔴 Not Started |
| Content Population | Content | Week 10 | 🔴 Not Started |
| Internal Testing | QA | Week 11 | 🔴 Not Started |
| Beta Launch | Product | Week 12 | 🔴 Not Started |
| Public Launch | Product | Week 14 | 🔴 Not Started |

### Release Strategy
- **Alpha:** Week 10 - Internal team testing
- **Beta:** Week 12 - 500 invited users
- **Soft Launch:** Week 14 - 10% geographic rollout
- **Full Launch:** Week 16 - 100% rollout with marketing

---

## 16. Success Criteria & Launch Readiness

### Launch Criteria (Must be true to ship)
- [ ] All Must-Have features complete
- [ ] 5,000+ questions in database
- [ ] Arabic autocomplete accuracy >95%
- [ ] Page load <2 seconds
- [ ] RTL renders correctly on all screens
- [ ] Works on Chrome, Safari, Firefox (latest)
- [ ] Mobile responsive (PWA)
- [ ] Critical bugs resolved (P0, P1)

### Post-Launch Monitoring
**Key Metrics:**
- DAU / MAU ratio
- Session duration
- Questions answered per session
- Streak retention
- Share rate

### Rollback Criteria
**Immediate action if:**
- Error rate > 2%
- Core gameplay broken
- Data loss detected

---

## 17. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| Arabic rendering issues | Medium | High | Extensive RTL testing, native Arabic speakers in QA | Engineering |
| Low initial adoption | Medium | High | Pre-launch marketing, influencer partnerships | Marketing |
| Content quality issues | Medium | Medium | Native speaker content review, user reporting | Content |
| Performance in MENA | Low | High | CDN with MENA presence, regional testing | DevOps |
| Competitor launches | Low | Medium | Fast iteration, unique features | Product |

---

## 18. Open Questions & Decisions

### Unresolved Questions
| Question | Owner | Due Date | Impact |
|----------|-------|----------|--------|
| Which map provider to use? | Engineering | Week 2 | Medium |
| Premium model timing? | Business | Week 4 | Medium |
| Native app timeline? | Product | Week 6 | High |

### Decision Log
| Date | Decision | Rationale | Decider |
|------|----------|-----------|---------|
| Jan 30, 2026 | Web-first MVP | Faster to market, easier iteration | Product |
| Jan 30, 2026 | Arabic-only V1 | Focus on core market | Product |

---

## 19. Competitive Analysis

| Feature | Rahal (رحال) | Travle.earth | GeoGuessr |
|---------|--------------|--------------|-----------|
| Arabic Support | ✅ Native | ❌ English | ❌ English |
| Path Game | ✅ | ✅ | ❌ |
| Quiz Mode | ✅ | ❌ | ❌ |
| Autocomplete Quiz | ✅ | ❌ | ❌ |
| Multiple Choice | ✅ | ❌ | ❌ |
| Landmark Questions | ✅ | ❌ | ✅ (visual) |
| Free to Play | ✅ | ✅ (ads) | ❌ (limited) |
| Mobile App | 🔜 V2 | ❌ | ✅ |
| Arab World Focus | ✅ | ❌ | ❌ |

---

## 20. Appendices

### Glossary
| Term | Definition |
|------|------------|
| رحال (Rahal) | Arabic for "Traveler" - the product name |
| RTL | Right-to-Left text direction |
| MENA | Middle East and North Africa region |
| PWA | Progressive Web App |
| DAU | Daily Active Users |
| MAU | Monthly Active Users |

### Sample Questions Database Structure

```
{
  "id": "q_001",
  "category": "capitals",
  "difficulty": "easy",
  "question_ar": "ما هي عاصمة مصر؟",
  "question_type": "multiple_choice",
  "correct_answer": "القاهرة",
  "options": ["القاهرة", "الإسكندرية", "الجيزة", "أسوان"],
  "hint": "أكبر مدينة في أفريقيا",
  "image_url": null,
  "tags": ["arab_world", "africa", "capitals"]
}
```

### Sample User Flow Wireframe

```
┌────────────────────────────────────┐
│  رحال 🌍                    ≡      │
├────────────────────────────────────┤
│                                    │
│   تحدي اليوم                       │
│   ─────────────                    │
│                                    │
│   🇧🇷 البرازيل ──────► 🇯🇵 اليابان │
│                                    │
│   [    اكتب اسم الدولة    ]       │
│                                    │
│   التخمينات السابقة:               │
│   1. 🟢 الأرجنتين                  │
│   2. 🟡 تشيلي                      │
│   3. 🟠 بيرو                       │
│                                    │
│   💡 تلميحات: 2/3                  │
│                                    │
├────────────────────────────────────┤
│  🏠    🎯    📊    ⚙️              │
│ الرئيسية  الأسئلة  الإحصائيات  الإعدادات│
└────────────────────────────────────┘
```

---

## Quality Checklist

- [x] Can a new engineer understand what to build?
- [x] All requirements testable/measurable?
- [x] Every requirement tied to user need/business goal?
- [x] Out of scope explicitly defined?
- [x] Success metrics have specific targets?
- [ ] All stakeholders reviewed?
- [ ] Designs linked or embedded?
- [x] Non-functional requirements specified?
- [x] Rollback plan documented?

---

## Document Approval

| Name | Role | Date |
|------|------|------|
| TBD | Product Manager | |
| TBD | Engineering Lead | |
| TBD | Design Lead | |

---

**Status:** ⏳ Draft

**Next Steps:**
- [ ] Stakeholder review and feedback
- [ ] Finalize technology stack decisions
- [ ] Begin design system creation
- [ ] Start content strategy and question creation
- [ ] Set up development environment

---

*رحال - اكتشف العالم من خلال اللعب*
*Rahal - Discover the World Through Play*
