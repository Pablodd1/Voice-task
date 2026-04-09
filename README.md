# LunaBill - AI-Powered Medical Billing Automation

## 🚀 Quick Deploy to Render.com

### Prerequisites
- [GitHub](https://github.com) account
- [Render.com](https://render.com) account (free)

### Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:
```bash
git init
git add .
git commit -m "LunaBill MVP - Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lunabill.git
git push -u origin main
```

### Step 2: Deploy to Render

1. **Create Render Account**: Go to [render.com](https://render.com) and sign up with GitHub

2. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `lunabill`
     - **Branch**: `main`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

3. **Add Environment Variables**:
   - Click "Environment" → "Add Environment Variable"
   - Add these:
     ```
     NODE_ENV=production
     JWT_SECRET=<generate_strong_random_string>
     JWT_EXPIRES_IN=24h
     PORT=10000
     ```

4. **Create PostgreSQL Database**:
   - Click "New +" → "PostgreSQL"
   - Configure:
     - **Name**: `lunabill-db`
     - **Database**: `lunabill`
     - **User**: `lunabill`

5. **Connect Database**:
   - Copy the "Internal Connection URL" from PostgreSQL
   - Add to Web Service Environment Variables:
     ```
     DATABASE_URL=postgresql://lunabill:password@host:port/lunabill
     ```

6. **Deploy**:
   - Click "Create Web Service"
   - Wait for build to complete (~2-3 minutes)

### Step 3: Access Your Application

- Your app will be available at: `https://lunabill.onrender.com`
- Health check: `https://lunabill.onrender.com/health`

### Step 4: Seed Database

1. Click on your Web Service → "Shell"
2. Run: `npm run seed`
3. Exit shell

## 🔑 Test Credentials

After seeding:
- **Email**: test@lunabill.com
- **Password**: password123

## 📱 Application URLs

| Page | URL |
|------|-----|
| Landing | `https://lunabill.onrender.com/` |
| Login | `https://lunabill.onrender.com/login` |
| Dashboard | `https://lunabill.onrender.com/dashboard` |
| API Health | `https://lunabill.onrender.com/health` |

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server (SQLite)
npm run dev

# Seed database with test data
npm run seed

# Start production-like server
npm start
```

## 📁 Project Structure

```
lunabill-mvp/
├── public/                  # Frontend (HTML/CSS/JS)
├── config/
│   └── database.js          # Database config (SQLite/PostgreSQL)
├── controllers/             # API business logic
├── middleware/              # Express middleware (auth)
├── models/                 # Sequelize models
├── routes/                 # API routes
├── scripts/                # Utilities (seed.js)
├── uploads/                # File uploads
├── server.js               # Express server
├── package.json
├── Dockerfile              # Docker deployment
└── .env.example            # Environment template
```

## ⚡ Features

### ✅ Implemented
- User authentication (JWT + bcrypt)
- Claims CRUD management
- Call simulation (AI voice agent demo)
- CSV/Excel file upload
- Real-time dashboard analytics
- Responsive design

### 🔄 Production Ready
- PostgreSQL database
- Environment-based configuration
- Docker support
- Health check endpoint

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile |

### Claims
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/claims` | Get all claims |
| POST | `/api/claims` | Create claim |
| GET | `/api/claims/:id` | Get claim |
| PUT | `/api/claims/:id` | Update claim |
| DELETE | `/api/claims/:id` | Delete claim |
| POST | `/api/claims/upload` | Upload CSV/Excel |

### Calls
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calls` | Get all calls |
| POST | `/api/calls/simulate` | Simulate AI call |

## 🏥 HIPAA Compliance Note

This is an MVP ready for demonstration. For production healthcare use:
- Enable HIPAA-compliant hosting
- Sign Business Associate Agreements (BAAs)
- Implement encryption at rest and in transit
- Add audit logging
- Conduct security assessments

## 📄 License

MIT License - See LICENSE file for details