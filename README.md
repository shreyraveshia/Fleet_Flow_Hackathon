# FleetFlow 🚛

A production-grade **MERN Stack Fleet & Logistics Management System** built for a hackathon.

## Features
- 🔐 JWT Auth (httpOnly cookie + Bearer) with role-based access (Admin / Manager / Driver / Viewer)
- 🚗 Vehicle Management — CRUD, status tracking, fuel type
- 👨‍✈️ Driver Management — profiles, license, assignment
- 🗺️ Trip Management — real-time status & location via Socket.io
- ⛽ Fuel Logging — efficiency analytics
- 🔧 Maintenance Scheduling — due-soon alerts
- 📊 Analytics Dashboard — Recharts
- 📤 Export — PDF (pdfkit) + CSV (json2csv)
- 🔔 Real-time Notifications — Socket.io rooms by role

## Tech Stack
| Layer | Tech |
|-------|------|
| Backend | Node.js, Express, MongoDB, Mongoose, Socket.io |
| Auth | JWT + bcryptjs + httpOnly cookies |
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui, Zustand |
| Charts | Recharts |
| Export | pdfkit, json2csv |

## Project Structure
```
fleetflow/
├── backend/    # Express REST API + Socket.io
└── frontend/   # React Vite SPA
```

## Getting Started

### Backend
```bash
cd backend
npm install
# Make sure MongoDB is running locally
npm run dev
# → http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## Environment Variables — `backend/.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/fleetflow
JWT_SECRET=your_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
BCRYPT_SALT_ROUNDS=10
```

> ⚠️ **Never commit `.env` files.** The `.gitignore` excludes them automatically.

## License
MIT
