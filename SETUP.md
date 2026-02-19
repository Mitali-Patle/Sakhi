# Sakhi — Local Setup Guide (No Docker)

## Prerequisites
- Node.js 18+ (`node --version`)
- A Supabase account (free at supabase.com)
- A smartphone with WhatsApp
- Git

---

## Step 1 — Clone & enter project

```bash
git clone <your-repo-url>
cd sakhi
```

---

## Step 2 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Set a database password (save it!)
3. Wait ~2 minutes for provisioning
4. Go to **Project Settings → Database → Connection String → URI**
5. Copy the URI — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```

---

## Step 3 — Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://postgres:yourpassword@db.xxxx.supabase.co:5432/postgres
PORT=3001
API_KEY=sakhi_secret_key_change_this
```

Also create `frontend/.env`:
```
VITE_API_URL=http://localhost:3001
VITE_API_KEY=sakhi_secret_key_change_this
```

---

## Step 4 — Database Migration

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
cd ..
```

You should see: `All migrations have been applied.`

Verify tables in Supabase → Table Editor.

---

## Step 5 — Start Backend

Open **Terminal 1**:

```bash
cd backend
npm run dev
```

Wait for:
```
🚀 Sakhi backend running on http://localhost:3001
📱 Scan WhatsApp QR at http://localhost:3001/qr
```

---

## Step 6 — Connect WhatsApp

1. Open browser → `http://localhost:3001/qr`
2. Open WhatsApp on your phone → ⋮ → Linked Devices → Link a Device
3. Scan the QR code
4. Wait for terminal to show: `✅ WhatsApp client is ready!`

> **Session is saved in `.wwebjs_auth/` folder.** You only need to scan once.
> If you restart the backend, it reconnects automatically.

---

## Step 7 — Start Frontend

Open **Terminal 2**:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Step 8 — Register Your First Group

1. On the login page, you'll see "Register SHG Group"
2. Fill in your group details
3. After creating, log in with the leader's WhatsApp number
4. Start adding members

---

## Step 9 — Test the Bot

From a member's phone, send any WhatsApp message to the leader's number.
The bot menu should appear in the member's set language.

---

## Useful Commands

```bash
# View database tables visually
cd backend && npx prisma studio

# Reset database (⚠️ deletes all data)
cd backend && npx prisma migrate reset

# Check backend is running
curl http://localhost:3001/health

# Rebuild after schema changes
cd backend && npx prisma migrate dev --name your_change_name
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| QR code not showing | Wait 30s for Chromium to start, then refresh `/qr` |
| WhatsApp disconnects | Delete `.wwebjs_auth/` folder, restart backend, scan QR again |
| Database error | Check `DATABASE_URL` in `.env` — must use port 5432, not 6543 |
| Supabase project paused | Go to Supabase dashboard and click "Restore project" |
| Port 3001 in use | `lsof -i :3001` then kill the process, or change `PORT` in `.env` |
| Port 5173 in use | `lsof -i :5173` then kill the process |
| `prisma generate` error | Run `npm install` in backend first |
| Puppeteer crash | Close other Chrome windows — Puppeteer needs memory |
