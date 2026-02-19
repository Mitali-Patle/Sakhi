# 🌸 Sakhi — SHG Financial Platform

A financial platform for rural Indian **Self Help Groups (SHGs)** that helps members record savings, manage loans, and build credit scores. Built with a Telegram chatbot for members and a web dashboard for group leaders.

---

## Setup & Installation

### Prerequisites

- **Node.js** 22+
- **Python** 3.10+
- **PostgreSQL** 16+ (installed and running)

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Telegram Bot
cd ../telegram_bot
pip install -r requirements.txt
```

### 2. Configure Environment Variables

**Backend** — create `backend/.env`:
```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/sakhi?schema=public
PORT=3001
```

**Telegram Bot** — create `telegram_bot/.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
BACKEND_URL=http://localhost:3001
API_KEY=sakhi_secret_key_change_this
```

> **Get a bot token:** Message [@BotFather](https://t.me/BotFather) on Telegram → `/newbot` → follow prompts → copy the token.

### 3. Set Up the Database

```bash
# Create the database (from psql)
CREATE DATABASE sakhi;

# Apply migrations
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 4. Run All Three Services

Open **three separate terminals**:

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev

# Terminal 3 — Telegram Bot
cd telegram_bot
python bot.py
```

Services will be available at:
- **Backend API:** http://localhost:3001
- **Frontend Dashboard:** http://localhost:5173
- **Telegram Bot:** polling (no port needed)

---

## Getting Started

### Step 1: Register Your SHG Group

1. Open http://localhost:5173
2. Click **"Register SHG Group →"**
3. Fill in group details (name, village, leader phone, etc.)
4. You'll be redirected to the dashboard

### Step 2: Add Members

1. Each member opens Telegram and messages your bot with `/start`
2. The bot replies: *"Your Telegram ID is: 1234567890"*
3. In the dashboard, go to **Members → Add Member**
4. Enter the member's name and phone number as `TG_1234567890`
5. Now the member can use the bot!

### Step 3: Members Use the Bot

Members message the bot on Telegram and interact via numbered menus:

```
Welcome to Sakhi 🌸

What would you like to do?

1. Record this month's contribution
2. Request a loan
3. View my credit score
4. View loan details
5. Contact my group leader
6. View government schemes

Type 'menu' anytime to return here.
```

---

## What Sakhi Does

| For Members (via Telegram) | For Leaders (via Web Dashboard) |
|---|---|
| Record monthly savings contributions | Register SHG groups and add members |
| Request loans with purpose tracking | Approve or reject loan requests |
| View credit score and savings summary | View group dashboard with analytics |
| Check active loan details | Download PDF credit reports for banks |
| View eligible government schemes | Manage member profiles |

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Telegram Bot    │────▶│  Node.js Backend │◀────│  React Frontend  │
│  (Python)        │     │  (Express + API) │     │  (Vite + React)  │
│  Port: polling   │     │  Port: 3001      │     │  Port: 5173      │
└─────────────────┘     └────────┬─────────┘     └──────────────────┘
                                 │
                        ┌────────▼─────────┐
                        │   PostgreSQL     │
                        │   (Prisma ORM)   │
                        └──────────────────┘
```

All three services run simultaneously. The Telegram bot and React frontend both communicate with the backend via REST API.

---

## Credit Score Engine

Sakhi calculates a **credit score (0–100)** for each member based on 9 weighted factors:

| Factor | Weight |
|--------|--------|
| Repayment on time | 25% |
| Growth trend | 15% |
| Speed of repayment | 15% |
| Tenure | 15% |
| Contribution frequency | 13% |
| Contribution amount & consistency | 12% |
| Group connections | 5% |
| Meeting attendance | 5% |
| Loan purpose | 5% |

New members get a **founding score** based on onboarding data (tenure, loans completed, etc.) until they have enough transaction history.

---

## Chatbot Conversation Flows

### Flow 1 — Monthly Contribution
```
Member: 1
Bot: How much are you contributing? (₹ amount)
Member: 500
Bot: Do you have a loan repayment? 1. Yes  2. No
Member: 2
Bot: Contribution: ₹500, Repayment: None. 1. Confirm  2. Re-enter
Member: 1
Bot: Thank you! Your record has been updated ✅
```

### Flow 2 — Loan Request
```
Member: 2
Bot: How much loan? → Purpose? → How many months? → Outstanding loan?
Bot: Your loan request has been sent to your leader 🌸
```

### Flow 3–6 — View Only
Credit score, loan details, leader contact, and government schemes are displayed instantly.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js 22, Express, Prisma 5.7 |
| Database | PostgreSQL (local or Supabase) |
| Telegram Bot | Python 3, python-telegram-bot 21.6, httpx |
| Frontend | React 18, Vite, Tailwind CSS |
| Languages | Tamil, Hindi, Telugu, English |

---

## Project Structure

```
sakhi_no_docker/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── index.js               # Express server entry point
│   │   ├── db/
│   │   │   └── prisma.js          # Prisma client singleton
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── groups.js      # SHG group CRUD
│   │   │   │   ├── members.js     # Member CRUD + Telegram lookup
│   │   │   │   ├── loans.js       # Loan request management
│   │   │   │   ├── transactions.js # Contributions & repayments
│   │   │   │   ├── dashboard.js   # Group analytics
│   │   │   │   └── reports.js     # PDF report generation
│   │   │   └── middleware/
│   │   │       └── auth.js        # API key authentication
│   │   └── services/
│   │       ├── creditScore.js     # 9-factor credit score engine
│   │       ├── schemeEligibility.js # Government scheme matching
│   │       └── pdfReport.js       # HTML report generator
│   ├── package.json
│   └── .env                       # DATABASE_URL, PORT
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Router with auth guards
│   │   ├── api/
│   │   │   └── client.js          # Axios API client
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Leader login by phone
│   │   │   ├── Dashboard.jsx      # Group overview & analytics
│   │   │   ├── Members.jsx        # Member list & management
│   │   │   ├── MemberDetail.jsx   # Individual member profile
│   │   │   ├── LoanApprovals.jsx  # Loan approval workflow
│   │   │   └── Reports.jsx        # Report downloads
│   │   └── components/
│   │       ├── GroupForm.jsx       # SHG group registration
│   │       └── MemberForm.jsx     # Add member form
│   ├── package.json
│   └── vite.config.js
│
├── telegram_bot/
│   ├── bot.py                     # State machine chatbot
│   ├── api_client.py              # HTTP calls to backend
│   ├── languages.py               # Messages in 4 languages
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # BOT_TOKEN, BACKEND_URL
│
├── .env.example                   # Template for environment vars
└── README.md
```

---

## API Reference

All routes are prefixed with `/api` and served on port 3001.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health check |
| **Groups** | | |
| GET | `/api/groups` | List all groups |
| GET | `/api/groups/:id` | Get group details |
| GET | `/api/groups/by-leader/:phone` | Lookup by leader phone |
| POST | `/api/groups` | Register new group |
| **Members** | | |
| GET | `/api/members/group/:groupId` | List members in group |
| GET | `/api/members/:id` | Get member profile |
| GET | `/api/members/by-telegram/:telegramId` | Lookup by Telegram ID |
| POST | `/api/members` | Add new member |
| PATCH | `/api/members/:id` | Update member |
| POST | `/api/members/:id/recalculate-score` | Trigger credit score recalc |
| GET | `/api/members/:id/schemes` | Get eligible schemes |
| **Transactions** | | |
| GET | `/api/transactions/member/:memberId` | Member's transactions |
| POST | `/api/transactions` | Save contribution/repayment |
| **Loans** | | |
| GET | `/api/loans/member/:memberId` | Member's loans |
| GET | `/api/loans/group/:groupId` | Group's loans |
| POST | `/api/loans` | Create loan request |
| PATCH | `/api/loans/:id/approve` | Approve loan |
| PATCH | `/api/loans/:id/reject` | Reject loan |
| **Reports** | | |
| GET | `/api/reports/group/:groupId` | Group report |
| GET | `/api/reports/member/:memberId` | Member credit report |
| **Dashboard** | | |
| GET | `/api/dashboard/:groupId` | Group analytics |

---

## Multi-Language Support

The bot supports **4 languages**, configured per member in the database:

| Language | Code |
|----------|------|
| Tamil | `TAMIL` |
| Hindi | `HINDI` |
| Telugu | `TELUGU` |
| English | `ENGLISH` |

All bot messages (menus, prompts, confirmations, errors) are fully translated. The leader sets each member's language when registering them.

---

## License

MIT
