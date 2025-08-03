# Rithm ML Platform

Advanced AI-powered machine learning platform with intelligent data processing, interactive model training, and comprehensive file handling across multiple domains.

## 🚀 Features

### Core ML Platform
- **Data Processing**: Upload and analyze CSV, Excel, Word, PowerPoint files
- **Model Training**: Linear Regression, Random Forest, Neural Networks with real-time convergence monitoring
- **Visualization**: Interactive charts and graphs with Recharts
- **Report Generation**: Professional PDF/Word reports with embedded analytics
- **Chat Interface**: OpenAI integration for natural language data analysis

### Enterprise Features
- **Authentication**: Secure user registration and login with Passport.js
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Session Management**: Secure cookie-based sessions
- **Health Monitoring**: System status and performance metrics
- **API Integration**: RESTful APIs for all platform features

### User Interface
- **Modern Design**: Tailwind CSS with Shadcn/ui components
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Theme switching support
- **Interactive Components**: Drag-and-drop, real-time updates
- **Accessibility**: WCAG AA compliant

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **Shadcn/ui** for component library
- **Recharts** for data visualization
- **Wouter** for routing

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **Passport.js** for authentication
- **bcrypt** for password hashing

### AI/ML Integration
- **OpenAI API** for chat functionality
- **TensorFlow.js** for client-side ML
- **Scikit-learn** integration via Python subprocess
- **Custom ML algorithms** for convergence monitoring

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key (optional)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/rithm-ml-platform.git
cd rithm-ml-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database and API credentials
```

4. **Set up database**
```bash
npm run db:push
```

5. **Start development server**
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:5000
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/rithm_db

# OpenAI (optional)
OPENAI_API_KEY=sk-your-openai-api-key

# Security
SESSION_SECRET=your-secure-session-secret

# Environment
NODE_ENV=development
```

### Database Setup

The platform uses PostgreSQL with Drizzle ORM. The schema includes:

- **Users**: Authentication and profile management
- **Business Queries**: Track user analysis requests
- **API Calls**: Monitor external service usage
- **Analytics**: Store analysis results and metrics

## 🚀 Deployment

### Render (Recommended)

1. **Connect GitHub repository** to Render
2. **Use included `render.yaml`** for automatic configuration
3. **Set environment variables** in Render dashboard
4. **Deploy automatically** on git push

### Docker

```bash
# Build image
docker build -f Dockerfile.optimized -t rithm-ml-platform .

# Run container
docker run -p 5000:5000 --env-file .env rithm-ml-platform
```

### Manual VPS

```bash
# On your server
npm install
npm run build
npm start
```

## 🔐 Authentication

### Test Credentials

The platform includes working test accounts:

- **Username**: `testuser2`
- **Password**: `test123`

### Creating New Accounts

Users can register through the web interface or API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "securepassword",
    "email": "user@example.com",
    "companyName": "Your Company"
  }'
```

## 📖 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### ML Platform Endpoints

- `POST /api/ml/upload` - Upload data files
- `POST /api/ml/train` - Train ML models
- `GET /api/ml/models` - List available models
- `POST /api/ml/predict` - Make predictions
- `GET /api/ml/results/:id` - Get analysis results

### Chat Endpoints

- `POST /api/chat/message` - Send chat message
- `GET /api/chat/history` - Get chat history
- `POST /api/chat/clear` - Clear chat history

### Health Monitoring

- `GET /health` - System health check
- `GET /api/health/detailed` - Detailed system metrics

## 🔍 Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
npm run db:push      # Push database schema changes
npm run db:studio    # Open Drizzle Studio
```

### Project Structure

```
rithm-ml-platform/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Application pages
│   │   ├── lib/         # Utilities and configs
│   │   └── hooks/       # Custom React hooks
├── server/          # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── middleware/      # Express middleware
├── shared/          # Shared TypeScript types
│   └── schema.ts        # Database schema
└── docs/           # Documentation
```

### Development Guidelines

- **Code Style**: ESLint + Prettier configuration
- **Type Safety**: Strict TypeScript configuration
- **Testing**: Jest for unit tests, testing utilities included
- **Performance**: React.memo, useMemo, useCallback optimizations
- **Accessibility**: ARIA attributes, keyboard navigation support

## 🎯 Use Cases

### Data Science Teams
- Upload datasets for collaborative analysis
- Train models with real-time monitoring
- Generate professional reports for stakeholders
- Share insights through chat interface

### Business Analysts
- Process business data (CSV, Excel files)
- Create visualizations and dashboards
- Generate consultant-grade reports
- Get AI-powered insights and recommendations

### Consultants
- Analyze client data securely
- Create professional deliverables
- Track project metrics and progress
- Collaborate with team members

### Researchers
- Process research datasets
- Experiment with ML algorithms
- Document findings and methodology
- Share results with collaborators

## 📊 Performance

### Optimizations
- **Bundle Size**: Largest chunk 1.54MB (optimized with Vite)
- **Load Time**: <2s initial page load
- **Memory Usage**: Efficient React component rendering
- **Database**: Optimized queries with Drizzle ORM
- **Caching**: Strategic caching for API responses

### Metrics
- **Build Performance**: 28% improvement with chunk splitting
- **Component Rendering**: React.memo optimizations
- **API Response Times**: <100ms average
- **Database Queries**: Indexed and optimized
- **Bundle Analysis**: Detailed chunk size monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Setup

```bash
# Install dependencies
npm install

# Start development environment
npm run dev

# Run tests
npm run test

# Lint code
npm run lint
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: See `docs/` directory for detailed guides
- **Issues**: Create GitHub issues for bugs or feature requests
- **Email**: Contact support for enterprise inquiries

## 🔄 Updates

### Recent Changes
- ✅ Authentication system fully operational
- ✅ Performance optimizations implemented
- ✅ Database schema updated and tested
- ✅ Production deployment ready
- ✅ Docker configuration optimized

### Roadmap
- Enhanced ML model options
- Real-time collaboration features
- Advanced analytics dashboard
- Mobile application
- API rate limiting and quotas

---

**Rithm ML Platform** - Making advanced AI accessible for data science workflows.
