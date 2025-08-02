# Deployment Guide

This guide covers deploying the Rithm Enterprise AI Platform to various environments.

## Quick Deploy Options

### 1. Replit Deployment (Recommended)

1. **Import to Replit**
   ```bash
   # Clone your repository in Replit or import from GitHub
   ```

2. **Set Environment Variables**
   - Go to Secrets tab in Replit
   - Add required variables:
     - `DATABASE_URL` (auto-provided by Replit PostgreSQL)
     - `OPENAI_API_KEY` (optional)
     - `ANTHROPIC_API_KEY` (optional)
     - `SESSION_SECRET` (random string)

3. **Deploy**
   - Click "Deploy" button
   - Choose "Reserved VM Deployment"
   - Build Command: `node build-production.js`
   - Run Command: `node production-server.js`
   - Port: `5000`

### 2. Docker Deployment

#### Single Container
```bash
# Build the image
docker build -t rithm-platform .

# Run with external database
docker run -p 5000:5000 \
  -e DATABASE_URL="your_postgres_url" \
  -e SESSION_SECRET="your_secret" \
  rithm-platform
```

#### Docker Compose (with PostgreSQL)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Cloud Platform Deployment

#### Render.com
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `node build-production.js`
4. Set start command: `node production-server.js`
5. Add environment variables in Render dashboard

#### Railway
1. Connect GitHub repository
2. Set build command: `node build-production.js`
3. Set start command: `node production-server.js`
4. Configure environment variables

#### Vercel (with serverless functions)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Configure environment variables in Vercel dashboard

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret key for session management

### Optional (for AI features)
- `OPENAI_API_KEY` - OpenAI GPT integration
- `ANTHROPIC_API_KEY` - Anthropic Claude integration

### Development
- `NODE_ENV` - Set to "production" for production deployments
- `PORT` - Port number (default: 5000)
- `VITE_API_BASE_URL` - API base URL for frontend

## Database Setup

### PostgreSQL (Recommended)
```sql
-- Create database
CREATE DATABASE rithm_platform;

-- Run migrations
npm run db:push
```

### Environment Database URL Format
```
postgresql://username:password@host:port/database_name
```

## Build Process

The application uses a multi-stage build process:

1. **Frontend Build**: React app built with Vite
2. **Backend Build**: Node.js server bundled with esbuild
3. **Dependency Optimization**: Only production dependencies included

### Manual Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Health Checks

The application provides health check endpoints:

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status

## Monitoring

### Logs
- Application logs are output to stdout
- Use your platform's log viewing tools

### Performance
- Monitor memory usage (Node.js ML workloads can be memory-intensive)
- Watch for database connection pool exhaustion
- Monitor API response times

## Scaling

### Horizontal Scaling
- The application is stateless (sessions stored in database)
- Can be scaled across multiple instances
- Use a load balancer for multiple instances

### Vertical Scaling
- Recommended minimum: 2 vCPU, 4GB RAM
- ML workloads benefit from more memory
- Database connections scale with instance count

## Security

### Production Checklist
- [ ] Set secure `SESSION_SECRET`
- [ ] Use HTTPS in production
- [ ] Restrict database access
- [ ] Set up proper CORS policies
- [ ] Enable security headers
- [ ] Regularly update dependencies

### Environment Security
- Never commit `.env` files
- Use platform-specific secret management
- Rotate API keys regularly
- Monitor for security vulnerabilities

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` format
   - Check database server accessibility
   - Ensure database exists

2. **Build Failures**
   - Check Node.js version (requires 20+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

3. **Memory Issues**
   - Increase container/instance memory
   - Monitor ML model memory usage
   - Check for memory leaks

4. **API Key Issues**
   - Verify API keys are correctly set
   - Check API key permissions and quotas
   - Monitor API usage and rate limits

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm start
```

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Review platform-specific documentation