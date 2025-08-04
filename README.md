# Rithm - AI Powered ML Platform

An advanced AI-powered machine learning platform that provides intelligent, interactive workflow visualization with comprehensive tool integration and robust report generation capabilities.

## Features

- **Authentic Data Processing**: Processes real-world datasets including World Economic Outlook data
- **ML Training & Analysis**: Complete machine learning pipeline with bias detection using Fairlearn
- **Chat-Based Report Editing**: Natural language report modification with structured JSON responses
- **McKinsey-Level Reports**: Professional consultant-grade report generation
- **Multi-Modal AI**: NLP, computer vision, and speech processing capabilities
- **Interactive Visualizations**: Dynamic charts and data exploration tools

## Technology Stack

- **Frontend**: React 18 with TypeScript, Shadcn/ui components
- **Backend**: Node.js Express with authentication
- **ML**: TensorFlow.js, scikit-learn, pandas
- **Visualization**: Recharts, Chart.js with canvas integration
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Optimized for Render.com (supports 10GB containers)

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Deployment

This platform is optimized for Render.com deployment:
- Supports large ML applications (9.9GB project size)
- Multi-stage Docker build for optimization
- Automatic Python ML dependency installation

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## Architecture

- **Zero Fabrication Policy**: All data processing uses authentic sources only
- **Zustand State Management**: Centralized state for cross-component communication
- **Professional Error Handling**: Comprehensive error recovery and user feedback
- **Accessibility Compliant**: WCAG AA standards with full screen reader support

## License

MIT
