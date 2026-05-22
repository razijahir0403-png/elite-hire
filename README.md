# Elite Hire Consultancy Maintenance System

Elite Hire Consultancy Maintenance System is a production-ready, full-stack MERN application configured for consultancy operations, candidate tracking, and detailed auditing of candidate transitions across core channels like Naukri and Indeed.

---

## 🚀 Key Features

1. **Secure Authentication**: Registered login/registration utilizing JWT tokens and bcrypt password hashing. Sessions persist safely using browser localStorage.
2. **Operations Dashboard**: Three modular quick-access views mapping to Naukri, Indeed, and Candidates. Integrates dynamic domain metric charts (Recharts).
3. **Advanced Sourcing Logs (CRUD)**:
   - Sourced candidate directory tracking `idnumber`, `domain`, `salaryPackage`, `location`, `contactNumber`, `resourcePerson`, `portalLink`, `status`, and `description`.
   - Advanced search querying, multi-field filters, and sorting.
   - Paged table layout built for desktop and mobile views.
4. **Audit History Trail**: Captures and appends all status modifications (including updater info, timestamp, and verification comments) into an immutable array.
5. **Interactive Workflows**: Dedicated modals for editing details, upgrading workflow status, and presenting interactive visual audit timelines.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide Icons, Axios, React Toastify, Recharts
- **Backend**: Node.js, Express.js, JWT, BcryptJS, Mongoose
- **Database**: MongoDB (Atlas or Local)

### Directory Structure

```text
elite-hire/
├── client/                     # Vite React Frontend
│   ├── src/
│   │   ├── components/         # Sidebar, Navbar, Modal, Spinner
│   │   ├── context/            # AuthContext API Provider
│   │   ├── pages/              # Login, Register, Dashboard, Naukri, Indeed, Analytics
│   │   ├── services/           # Axios interceptor API client
│   │   ├── App.jsx             # Routers, layouts, and route guards
│   │   └── index.css           # Styling directives & glassmorphic classes
│   ├── tailwind.config.js      # Custom theme definitions
│   └── vite.config.js          # React server routing settings
│
├── server/                     # Node Express Backend
│   ├── config/                 # Mongoose connection
│   ├── controllers/            # Auth and Analytics controllers
│   ├── middleware/             # JWT route guard validation
│   ├── models/                 # User and Analytics Mongoose schemas
│   ├── routes/                 # Express route definitions
│   └── utils/                  # DB Mock database seeder
```

---

## ⚙️ Environment Variables Setup

Ensure you configure the `.env` variables inside the backend directory.

### Backend (`server/.env`)

Create a `server/.env` file with:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/elite-hire
JWT_SECRET=elite_hire_very_secure_secret_key_123!@#
NODE_ENV=development
```

### Frontend (`client/.env`)

Vite automatically detects `VITE_API_BASE_URL` if present. If omitted, the frontend falls back to `http://localhost:5000/api`.

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 💻 Local Installation & Run Guide

Follow these steps to run the application locally:

### 1. Install all dependencies
From the root workspace directory, run:
```bash
npm run install-all
```
This single command executes `npm install` recursively at the root, inside `/server`, and inside `/client`.

### 2. Seed Mock Database Records
To verify functionality instantly, seed candidate details and a mock Admin user:
```bash
npm run seed
```
This populates the database with:
- **Default Account**: `admin@elitehire.com` / `password123`
- Five candidate tracking logs linked to Naukri and Indeed profiles containing multi-tier status histories.

### 3. Run Development Servers
Launch both the frontend Vite page and backend Express API simultaneously:
```bash
npm run dev
```
- **Frontend** runs on: `http://localhost:5173`
- **Backend API** runs on: `http://localhost:5000`

---

## ☁️ Production Deployment Guide

### Database (MongoDB Atlas)
1. Register on MongoDB Atlas and spawn a free Shared Cluster.
2. In **Database Access**, create a user with read/write access.
3. In **Network Access**, whitelist `0.0.0.0/0` or whitelist deployment service IPs.
4. Retrieve the Mongoose connection string (e.g. `mongodb+srv://<user>:<password>@cluster0...`).

### Backend (Render)
1. Link your git repository to Render.
2. Spawn a new **Web Service**, specifying:
   - **Environment**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Under **Advanced**, add Environment Variables matching `server/.env`:
   - `PORT=5000`
   - `NODE_ENV=production`
   - `MONGODB_URI=your_mongodb_atlas_connection_string`
   - `JWT_SECRET=your_jwt_secret_key`
4. Deploy the service and copy the provided render subdomain URL (e.g., `https://elite-hire-api.onrender.com`).

### Frontend (Vercel)
1. Connect Vercel to your Github Repository.
2. Create a new project, selecting the **Root Directory** as `client`.
3. Select **Vite** as the framework preset.
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL=https://elite-hire-api.onrender.com/api` (Point to your deployed Render URL suffix)
5. Trigger **Deploy**.
