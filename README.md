# 🌊 Wavy — Ocean Hazard Detector | v4 (Full Stack)

## Version History
| Version | Folder             | What's inside                              |
|---------|--------------------|--------------------------------------------|
| v1      | wavy-project/      | Frontend only                              |
| v2      | wavy-project-v2/   | Frontend + MongoDB backend                 |
| v3      | wavy-project-v3/   | Landing page + Login + Register + MySQL    |
| **v4**  | **wavy-project-v4/**| **+ Admin Panel + Email Alerts + Git + Deploy** |

---

## 📁 Project Structure
```
wavy-project-v4/
├── index.html                    ← Landing page
├── .gitignore                    ← Git ignore file
├── render.yaml                   ← Deploy config (Render.com)
│
├── pages/
│   ├── login.html                ← Login page
│   ├── register.html             ← Sign up page
│   ├── dashboard.html            ← User dashboard
│   └── admin.html                ← 👑 Admin panel (NEW)
│
├── css/
│   ├── landing.css
│   ├── auth.css
│   ├── dashboard.css
│   └── admin.css                 ← Admin styles (NEW)
│
├── js/app.js                     ← Frontend JS
├── assets/images/                ← Ocean images
│
└── backend/
    ├── server.js                 ← Express + Socket.io
    ├── package.json              ← npm install here
    ├── .env                      ← ⚠ Your secrets (NEVER commit)
    │
    ├── config/db.js              ← MySQL connection + table creation
    ├── services/
    │   └── emailService.js       ← 📧 Nodemailer email alerts (NEW)
    ├── controllers/
    │   ├── authController.js     ← Register, Login, Profile
    │   ├── hazardController.js   ← Hazards + email trigger
    │   ├── weatherController.js  ← OpenWeatherMap API
    │   ├── donationController.js ← Donations
    │   └── adminController.js    ← 👑 Admin CRUD (NEW)
    ├── routes/
    │   ├── authRoutes.js
    │   ├── hazardRoutes.js
    │   ├── weatherRoutes.js
    │   ├── donationRoutes.js
    │   └── adminRoutes.js        ← Admin routes (NEW)
    └── middleware/auth.js        ← JWT + adminOnly guard
```

---

## 🚀 Step-by-Step Run Guide

### 1. MySQL Setup
Open **MySQL Workbench** or terminal and run:
```sql
CREATE DATABASE wavy_db;
```

### 2. Configure .env
Open `backend/.env` and fill in:
```
DB_USER=root
DB_PASSWORD=your_mysql_password
```

### 3. Install & Start Backend
```bash
cd wavy-project-v4/backend
npm install
npm run dev
```

You'll see:
```
✅ MySQL Connected
✅ All tables ready
✅ Sample hazards seeded
✅ Admin seeded — email: admin@wavy.ocean | password: Admin@123
🌊 Wavy v4 Backend — port 5000
```

### 4. Open Frontend
Right-click `index.html` → **Open with Live Server**

---

## 👑 Admin Panel
URL: `http://127.0.0.1:5500/pages/admin.html`

Default admin login:
- **Email:** `admin@wavy.ocean`
- **Password:** `Admin@123`

Admin can:
- View dashboard summary (users, hazards, donations, emails sent)
- Edit / Resolve / Delete hazards
- Manage users (promote to admin, deactivate, delete)
- View all donations with totals
- See email alert logs

---

## 📧 Email Alerts Setup (Gmail)

### Step 1 — Get Gmail App Password
1. Go to your Google Account → **Security**
2. Turn on **2-Step Verification** (if not already)
3. Go to **App Passwords**
4. Select app: **Mail** → device: **Other** → name it "Wavy"
5. Click **Generate** → copy the 16-character password

### Step 2 — Add to .env
```
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop   ← paste the 16-char password
```
Remove all spaces from the app password.

### Step 3 — Restart backend
```bash
npm run dev
```

Now whenever a hazard is reported → all users matching their alert preference get a beautiful HTML email!

---

## 🔧 Git Setup (Version Control)

### First time — Initialize Git
Open VS Code terminal in the `wavy-project-v4` folder:
```bash
git init
git add .
git commit -m "🌊 Initial commit — Wavy v4 Full Stack"
```

### Save your work anytime
```bash
git add .
git commit -m "your message here"
```

### Push to GitHub
```bash
# Create a repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/wavy.git
git push -u origin main
```

### Check history
```bash
git log --oneline
```

---

## 🌐 Deploy FREE on Render.com

### Backend (Node.js API)
1. Push your code to GitHub (see Git steps above)
2. Go to **render.com** → Sign up free
3. Click **New** → **Web Service**
4. Connect your GitHub repo
5. Set **Root Directory** to `backend`
6. Set **Build Command:** `npm install`
7. Set **Start Command:** `npm start`
8. Add environment variables from your `.env`
9. Click **Deploy** — done! 🎉

### MySQL on Render
- In Render dashboard → **New** → **PostgreSQL** (free)  
- OR use **PlanetScale** (free MySQL cloud): planetscale.com
  - Create database → Get connection string
  - Use it as your DB_HOST, DB_USER, DB_PASSWORD

### Frontend
- Push frontend files to GitHub
- Go to **Netlify** (netlify.com) → Drag & drop your folder → instant deploy!
- OR use **GitHub Pages** (free)

---

## 📡 API Reference (http://localhost:5000/api)
| Method | Route                        | Auth    | Description             |
|--------|------------------------------|---------|-------------------------|
| POST   | /auth/register               | No      | Create account + welcome email |
| POST   | /auth/login                  | No      | Login → JWT token       |
| GET    | /auth/me                     | User    | My profile              |
| PUT    | /auth/settings               | User    | Update preferences      |
| GET    | /hazards                     | No      | List hazards            |
| GET    | /hazards/stats               | No      | Dashboard counts        |
| GET    | /hazards/geo                 | No      | Map pin data            |
| POST   | /hazards                     | User    | Report + email alert    |
| PUT    | /hazards/:id                 | Admin   | Update hazard           |
| DELETE | /hazards/:id                 | Admin   | Delete hazard           |
| GET    | /weather/current?city=X      | No      | Live weather            |
| GET    | /weather/forecast?city=X     | No      | 5-day forecast          |
| POST   | /donations                   | User    | Submit donation         |
| GET    | /admin/summary               | Admin   | Full dashboard stats    |
| GET    | /admin/users                 | Admin   | All users               |
| PUT    | /admin/users/:id             | Admin   | Update user role        |
| DELETE | /admin/users/:id             | Admin   | Delete user             |
| GET    | /admin/hazards               | Admin   | All hazards             |
| PUT    | /admin/hazards/:id/resolve   | Admin   | Resolve hazard          |
| GET    | /admin/donations             | Admin   | All donations           |
| GET    | /admin/alerts                | Admin   | Email alert logs        |
