# Quick Start Guide - BankUI

Get the banking application running locally in 5 minutes!

## Option 1: Docker Compose (Recommended - 2 minutes)

### Prerequisites
- Docker & Docker Compose installed

### Steps

```bash
# Navigate to project
cd /Users/aaryamanmishra/Documents/bankui

# Start services
docker-compose up

# Wait for services to start (2-3 minutes)
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Create Test Account

1. Go to http://localhost:5173
2. Click "Sign up"
3. Fill in details:
   - Name: Test User
   - Email: test@example.com
   - Phone: 9876543210
   - Password: password123
4. Create account
5. Login with credentials

### Test Payment Transfer

1. Dashboard shows your account with ₹0 balance
2. **To test transfers between users:**
   - Create another test account (test2@example.com, phone: 9876543211)
   - Add initial balance via database (contact support or use API)
   - Click "Send Money"
   - Enter recipient phone and amount
   - Confirm transfer

## Option 2: Manual Setup (5-10 minutes)

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create database tables
python migrations/create_tables.py

# Run server
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

## Project Structure

```
bankui/
├── backend/              # FastAPI application
├── frontend/             # React application
├── docker-compose.yml    # Local development setup
├── README.md             # Full documentation
├── AWS_DEPLOYMENT.md     # AWS deployment guide
└── template.yaml         # CloudFormation template
```

## API Endpoints (Quick Reference)

**Authentication:**
- `POST /auth/register` - Create account
- `POST /auth/login` - Login

**User:**
- `GET /user/profile` - Get user info
- `GET /user/balance` - Check balance

**Payments:**
- `POST /payments/transfer` - Send money
- `POST /payments/validate` - Validate payment
- `GET /payments/history` - Transaction history

See full API docs at http://localhost:8000/docs

## Database Schema

Tables created:
- `users` - User accounts
- `transactions` - Payment history
- `beneficiaries` - Saved recipients
- `virtual_cards` - Virtual card management
- `bill_payments` - Bill tracking
- Plus existing: `credit_accounts`, `repayments`, `risk_scores`

## Features Available

✅ **Implemented:**
- User registration & login
- Send money with validation
- Transaction history
- Balance tracking
- Transaction limits (₹100,000 per transfer, ₹500,000 daily)
- JWT authentication
- Professional UI

🔄 **Coming Soon:**
- Request money
- Bill payments
- Virtual cards
- Digital wallet

## Troubleshooting

**Port already in use?**
```bash
# Kill process on port
kill -9 $(lsof -t -i:5173)    # Frontend
kill -9 $(lsof -t -i:8000)    # Backend
```

**Database connection error?**
- Verify internet connection (Railway DB is hosted externally)
- Check DATABASE_URL in .env file

**Frontend can't reach backend?**
- Ensure backend is running (http://localhost:8000)
- Check network proxy settings

**Dependency issues?**
- Backend: Clear pip cache and reinstall
- Frontend: Delete node_modules and reinstall

## Testing the Payment Flow

1. **Create first user**
   - Register: test1@example.com

2. **Create second user**
   - Register: test2@example.com

3. **Test transfer**
   - Login as test1
   - Click "Send Money"
   - Enter test2's phone number (9876543211)
   - Enter amount: ₹100
   - Confirm transfer
   - See success screen
   - Check transaction history

## Next Steps

1. **Explore API** → Visit http://localhost:8000/docs
2. **Check code** → Review backend/app/* and frontend/src/*
3. **Deploy** → Follow AWS_DEPLOYMENT.md for production
4. **Customize** → Update colors, add features, etc.

## Important Notes

⚠️ **For Production:**
- Change SECRET_KEY in .env
- Update DATABASE_URL to your own database
- Enable HTTPS
- Configure CORS origins
- Set up monitoring/logging
- Use AWS Secrets Manager for credentials

## Support

- Full API documentation: http://localhost:8000/docs
- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`
- Check README.md for detailed documentation
- Check AWS_DEPLOYMENT.md for AWS setup

## Quick Commands

```bash
# Stop services
docker-compose down

# Rebuild and start fresh
docker-compose down --volumes
docker-compose up --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Access backend shell
docker-compose exec backend bash

# Database migration
docker-compose exec backend python migrations/create_tables.py
```

Happy banking! 🏦
