# BankUI - Digital Banking Application

A Google Pay-like payment application with Kotak 811 features built with React, FastAPI, and PostgreSQL.

## Features

- **User Authentication**: Secure login/registration with JWT tokens
- **Money Transfer**: Send money to contacts with validation and limits
- **Transaction History**: View all payment transactions
- **Virtual Cards**: (Coming soon) Create and manage virtual cards
- **Bill Payments**: (Coming soon) Pay utility bills
- **Request Money**: (Coming soon) Request payments from contacts
- **Modern UI**: Professional banking interface built with Tailwind CSS
- **AWS Ready**: Deployable to AWS Lambda + API Gateway

## Tech Stack

- **Frontend**: React 18 + Redux + Tailwind CSS + Vite
- **Backend**: Python FastAPI + SQLAlchemy + PostgreSQL
- **Database**: PostgreSQL with Railway
- **Deployment**: AWS Lambda + API Gateway
- **Containerization**: Docker & Docker Compose

## Project Structure

```
bankui/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Configuration
│   │   ├── database.py          # DB connection
│   │   ├── models/              # SQLAlchemy & Pydantic models
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic
│   │   └── middleware/          # Auth middleware
│   ├── migrations/              # Database migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── lambda_handler.py        # AWS Lambda handler
├── frontend/
│   ├── src/
│   │   ├── pages/               # Page components
│   │   ├── components/          # UI components
│   │   ├── store/               # Redux store
│   │   ├── services/            # API services
│   │   ├── utils/               # Helpers
│   │   └── App.jsx              # Main app
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml           # Local development
└── README.md
```

## Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (if running frontend locally)
- Python 3.11+ (if running backend locally)

### Option 1: Docker Compose (Recommended)

```bash
# Clone/setup the project
cd bankui

# Start both services
docker-compose up

# Access:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

**Backend:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create database tables
python migrations/create_tables.py

# Run server
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Database

The application uses a PostgreSQL database at Railway. The schema includes:

- **users** - User accounts with KYC details
- **transactions** - Payment history
- **beneficiaries** - Saved payment recipients
- **virtual_cards** - Virtual card management
- **bill_payments** - Bill payment tracking
- **credit_accounts** - Credit/loan accounts
- **repayments** - Repayment tracking
- **risk_scores** - Risk assessment data

### Database Migration

To create new tables:
```bash
python backend/migrations/create_tables.py
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### User
- `GET /user/profile` - Get user details
- `GET /user/balance` - Get account balance

### Payments
- `POST /payments/transfer` - Transfer money
- `POST /payments/validate` - Validate transfer
- `GET /payments/history` - Transaction history
- `POST /payments/beneficiaries` - Add beneficiary
- `GET /payments/beneficiaries` - List beneficiaries

## Transaction Limits

- **Per Transaction**: ₹100,000 maximum
- **Daily Limit**: ₹500,000 per user

## AWS Deployment

### Lambda + API Gateway Setup

1. **Prepare Backend:**
```bash
cd backend
pip install -r requirements.txt -t package/
cp -r app lambda_handler.py package/
cd package
zip -r ../lambda_function.zip .
```

2. **Create Lambda Function:**
   - Runtime: Python 3.11
   - Handler: `lambda_handler.handler`
   - Upload ZIP file
   - Set environment variables (DATABASE_URL, SECRET_KEY, etc.)
   - Memory: 512 MB
   - Timeout: 30 seconds

3. **Create API Gateway:**
   - Create REST API
   - Proxy all requests to Lambda
   - Enable CORS
   - Deploy to stage

4. **Frontend Deployment:**
```bash
npm run build
# Upload dist folder to CloudFront or S3
```

## Environment Variables

Create `.env` file in backend:
```
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
AWS_REGION=ap-south-1
```

## Security

- Passwords hashed with bcrypt
- JWT token authentication
- Input validation on all endpoints
- Transaction amount limits enforced
- CORS enabled for frontend origin
- Database indexes for performance

## Testing

### Manual Testing
- Create test user account
- Test login flow
- Transfer money between test accounts
- Check transaction history
- Verify database updates

### Test Accounts

You can create test accounts through the registration page:
- Name: Test User
- Email: test@example.com
- Phone: 9876543210
- Password: password123

## Development Workflow

1. Create a feature branch
2. Make changes to backend/frontend
3. Test locally with Docker Compose
4. Run database migrations if needed
5. Test payment flows end-to-end
6. Create pull request
7. Deploy to staging/production

## Troubleshooting

**Backend Connection Error:**
- Check DATABASE_URL is correct
- Verify PostgreSQL is accessible
- Check network connectivity

**Frontend API Calls Failing:**
- Verify backend is running
- Check CORS settings
- Review API response in browser DevTools

**Payment Transfer Fails:**
- Check user balance
- Verify recipient exists
- Check transaction limits

## Performance Tips

- Database queries use indexes on user_id, timestamp
- Connection pooling configured in SQLAlchemy
- Pagination on transaction history
- Frontend uses Redux for state management

## License

MIT

## Support

For issues or questions, please check the API documentation at `/docs` endpoint when running backend.
