# FleetFlow — Intelligent Fleet & Logistics Management

FleetFlow is a state-of-the-art fleet management system designed for logistics companies to oversee vehicles, drivers, trips, and expenses in real-time. Built with a focus on operational efficiency and financial transparency.

## ✨ Core Features

- **Multi-Role Dashboards**: Specialized views for Managers (KPIs), Dispatchers (Operations), Safety Officers (Compliance), and Financial Analysts (ROI).
- **Real-time Synchronization**: Powered by Socket.io, ensuring all users see live trip updates and vehicle status changes instantly.
- **Trip Lifecycle Management**: Multi-step dispatch workflow with cargo weight validation and automated odometer tracking.
- **Maintenance Tracking**: Preventative maintenance scheduling with automated vehicle status transitions ("Available" → "In Shop").
- **Financial Analytics**: Deep dive into fuel efficiency (km/L), ROI per vehicle, and monthly operational trends.
- **Safety First**: Driver safety scoring and proactive license expiry alerting system.

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite (Chunk splitting & Lazy loading)
- Tailwind CSS + shadcn/ui (Dark Mode supported)
- Zustand (State Management)
- Recharts (Data Visualization)
- Socket.io Client

**Backend:**
- Node.js + Express
- MongoDB + Mongoose (Schema-based data modeling)
- JWT + RBAC Middleware (Security)
- Socket.io Server (Real-time Fan-out)
- PDFKit & json2csv (Reporting)

## 🚀 Rapid Setup

### Prerequisites
- Node.js v16+
- MongoDB instance (Local or Atlas)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [repository-url]
   cd FleetFlow
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create .env with MONGODB_URI and JWT_SECRET
   npm run seed # Populate with realistic demo data
   npm start
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   # Create .env with VITE_API_URL and VITE_SOCKET_URL
   npm run dev
   ```

## 🔑 Demo Access

| Role | Email | Password |
| :--- | :--- | :--- |
| **Fleet Manager** | manager@fleet.com | password123 |
| **Dispatcher** | dispatcher@fleet.com | password123 |
| **Safety Officer** | safety@fleet.com | password123 |
| **Financial Analyst** | finance@fleet.com | password123 |

---
*Built for the FleetFlow Logistics Hackathon.*
