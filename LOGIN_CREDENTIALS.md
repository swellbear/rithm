# Login Information for Rithm ML Platform

## 🔐 Working Authentication System ✅

**PRODUCTION-READY AUTHENTICATION**

The authentication system is fully operational with existing user accounts.

### Working Login Credentials

**Option 1: Existing User Account**
- **Username:** `testuser2`
- **Password:** `test123`

**Option 2: ML Test Account**  
- **Username:** `mltest`
- **Password:** `password123`

### Authentication Features

✅ **Secure Password Hashing** - bcrypt with salt rounds  
✅ **Session Management** - Passport.js with secure cookies  
✅ **Database Integration** - PostgreSQL with user persistence  
✅ **Login Validation** - Proper credential verification  
✅ **User Profile Management** - Company details and preferences  

### How to Login

1. **Visit the Application**
2. **Click "Sign In"** 
3. **Enter Credentials** from the working accounts above
4. **Access Full Features** with authenticated session

### API Endpoints

**Login:** `POST /api/auth/login`
**Register:** `POST /api/auth/register` 
**Logout:** `POST /api/auth/logout`
**Profile:** `GET /api/auth/me`

### Enterprise Features (Authenticated)

- **Personalized Dashboard** - User-specific data and preferences
- **Session Persistence** - Stay logged in across browser sessions  
- **Company Profile** - Business information and consulting focus
- **Usage Analytics** - Track queries and system usage
- **Advanced Security** - Protected routes and data access

## Login Process

After registration, you can log in using:

**Endpoint:** `POST /api/auth/login`
```json
{
  "username": "your_username", 
  "password": "your_password"
}
```

## Security Features

- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **Session Management**: Express sessions with memory store
- ✅ **Authentication Middleware**: Passport.js Local Strategy
- ✅ **Input Validation**: Zod schema validation
- ✅ **Security Headers**: Helmet.js protection

## Public Endpoints (No Login Required)

Some features are available without authentication:
- **Chat API**: `/api/ml/chat-public` 
- **Health Check**: `/health`
- **Model Downloads**: `/api/download/*`

## Enterprise Features (Login Required)

Full platform access includes:
- Data management and visualization
- ML model training and evaluation
- Professional report generation
- File processing (CSV, Excel, Word, PowerPoint)
- Advanced analytics and insights

## Troubleshooting

**Issue**: "Username already exists"
- **Solution**: Try a different username or use login if you already registered

**Issue**: "Invalid credentials" 
- **Solution**: Check username/password spelling, or register if you haven't yet

**Issue**: "Database not available"
- **Solution**: The app works without database, but registration requires database connection