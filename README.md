# ResearchNest

A research-literature platform: discover papers, save them into stacks, read them in a built-in
reader, and get hybrid TF-IDF recommendations. It includes an admin console and an AI chatbot (NestAI).

| Part | Folder | Stack | Port |
|------|--------|-------|------|
| Frontend | `frontend/` | React 19 + Vite | 5173 |
| Backend API | `backend/` | Spring Boot 4, Java 17, MySQL | 8081 |
| Recommendation service | `ai-service/` | FastAPI, scikit-learn | 8000 |

## Prerequisites
Java 17, Node 18+, Python 3.10+, MySQL 8 (create an empty database named `researchnest`).

## 1. Backend
```bash
cd backend
cp .env.example .env      # then edit .env with your DB and Gmail app-password values
./mvnw spring-boot:run
```
All secrets are read from `backend/.env` (git-ignored) or from environment variables. Nothing sensitive
is stored in `application.properties`.

Key settings (see `backend/.env.example`):

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` - MySQL connection
- `MAIL_USERNAME`, `MAIL_PASSWORD` - Gmail **app password**, used to email 2FA and password-reset codes
- `JWT_SECRET` - at least 32 characters (required in production)
- `GOOGLE_CLIENT_ID` - optional Google sign-in
- `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` - creates the first admin account on startup

### Developer mode
`APP_DEV_MODE=true` is for a local machine only. It seeds demo accounts, prints OTPs in the console, enables a
demo master OTP and accepts fake Google tokens. It is **off by default** and must stay off anywhere else.

## 2. AI recommendation service
```bash
cd ai-service
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```
The backend falls back to built-in heuristics if this service is not running.

## 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Open http://localhost:5173. Demo shortcuts (fake admin session, fake Google sign-in) only exist in the dev server
and only when `VITE_ENABLE_DEMO_LOGIN=true` is set in `frontend/.env.local`.

## Tests
```bash
cd backend && ./mvnw test
```
Tests use the configured MySQL database.
