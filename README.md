# Rithm

A comprehensive AI-powered machine learning platform featuring intelligent workflow visualization, enterprise-grade authentication, and advanced data processing capabilities.

## Features

### Core Capabilities
- **Machine Learning Platform**: Data management, model training (Linear Regression, Random Forest), convergence monitoring, and visualization
- **AI Chat Interface**: Natural language processing with OpenAI and Anthropic integration
- **Authentication System**: Secure user management with Passport.js and bcrypt
- **Report Generation**: Professional-grade reports in Word and PowerPoint formats
- **Database Integration**: PostgreSQL with Drizzle ORM
- **Real-time Analytics**: Interactive dashboards and data visualization

### Technical Architecture
- **Frontend**: React 18 with TypeScript, Vite build system, Tailwind CSS
- **Backend**: Node.js with Express, PostgreSQL database
- **AI Integration**: OpenAI GPT models, Anthropic Claude
- **Security**: Modern authentication, CSRF protection, secure headers
- **Deployment**: Docker containerization, production-ready configuration

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- OpenAI API key (optional)
- Anthropic API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rithm.git
   cd rithm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and API keys
   ```

4. **Initialize database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
docker build -t rithm-platform .
docker run -p 5000:5000 rithm-platform
```

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude integration
- `SESSION_SECRET` - Secret key for session management
- `NODE_ENV` - Environment (development/production)

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Machine Learning
- `POST /api/ml/upload` - Upload dataset
- `POST /api/ml/train` - Train ML model
- `GET /api/ml/models` - List trained models
- `POST /api/ml/predict` - Make predictions

### Chat
- `POST /api/chat/message` - Send chat message
- `GET /api/chat/history` - Get chat history

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue on GitHub or contact the development team.