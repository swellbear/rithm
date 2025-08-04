# Rithm Enterprise AI Platform

## Overview
This platform is a comprehensive AI solution integrating machine learning convergence monitoring, bioimpedance analysis, mathematical frameworks, and conversational AI. It is designed for various deployment environments, including Replit, Windows standalone, and web-based interfaces. The project's vision is to make advanced AI accessible, providing tools for data analysis, model training, and professional report generation with a focus on real-world data and enterprise-grade security.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (August 2025)
- **Deployment Crisis Resolution**: Solved persistent "Cannot find package 'vite'" error affecting Render deployments
- **Production Architecture**: Implemented production-first import strategy eliminating all Vite dependencies from production builds
- **Custom Build System**: Created `build-production.js` with comprehensive esbuild configuration for deployment reliability
- **Security Enhancement**: Generated cryptographically secure SESSION_SECRET (749343bc...) for production authentication
- **AI Integration Analysis**: Integrated and exceeded Grok AI recommendations for deployment optimization
- **Training Error Fix (Aug 3)**: Resolved build script mismatch causing "command failed" errors - fixed output path from `dist/production-server.js` to `dist/index.js`
- **Critical Deployment Fixes (Aug 4)**: Identified and resolved multiple deployment configuration issues:
  - Fixed API routing conflicts (`/api/` → `/api` path matching in server/vite-production.ts)
  - Corrected authentication schema mismatch (password_hash vs password field)
  - Resolved SIGTERM crashes by updating render.yaml to use `node build-production.js` instead of incomplete `npm run build`
  - Fixed port configuration inconsistency (PORT=10000 consistently across environment)
  - Identified render.yaml location issue (must be in root directory, not /src/)
  - Enhanced session configuration for mobile compatibility with proper cookie settings
- **ML Training System Completion (Aug 4)**: Final resolution of Python ML script issues:
  - Fixed `server/ml/authentic-trainer.py` to properly handle JSON input via stdin and command line
  - Enhanced data format parsing to support dict/list/DataFrame conversions for real-world data
  - Replaced embedded Python code in Node.js routes with clean subprocess calls to standalone Python scripts
  - Eliminated syntax errors from mixed Python/TypeScript code in server/routes/ml.ts
  - Verified authentic ML results: MSE scores, R2 values, feature importance from scikit-learn algorithms
  - **STATUS**: ML training now works with genuine results - no more network errors or mock data

## System Architecture

### Frontend Architecture
The frontend is built with React, leveraging Vite for modern development. It supports multiple interface approaches, including standalone HTML interfaces with embedded React via CDN. Styling is managed with Tailwind CSS, supporting responsive design and a dark theme. UI components are built using Shadcn/ui for consistency.

### Backend Architecture
The backend uses Node.js/Express, supporting various server configurations including a main API server for ML operations and standalone servers for specific use cases. It follows a RESTful API design and manages data through local file storage.

### Key Architectural Decisions
-   **Multi-Interface Strategy**: Supports React applications, standalone HTML, and Windows executables for maximum compatibility and deployment flexibility.
-   **Embedded vs. External Dependencies**: Employs a hybrid approach using both npm packages and CDN-based libraries to balance functionality with deployment simplicity.
-   **Mathematical Framework Integration**: Encapsulates complex mathematical engines within conversational wrappers to make advanced algorithms accessible.
-   **Component Modularization**: Refactored monolithic components into smaller, modular units (e.g., `DataManagementPanel`, `ChatPanel`, `ResultsPanel`) for improved maintainability and scalability.
-   **State Management**: Centralized state management is achieved using Zustand, eliminating prop drilling and optimizing performance.
-   **Local AI Integration**: Leverages CPU-based local AI models (e.g., Phi-3-mini) for offline capabilities, with progress monitoring and efficient memory management.
-   **Dual-Interface Report Editing**: Supports both conversational AI-driven editing and a visual editor for reports, with a structured JSON action dispatch system.
-   **Security Architecture**: Implements comprehensive security measures including file size limits, client-side validation, enhanced privacy warnings, enterprise authentication (Passport.js with bcrypt), and modern security headers (CSP).
-   **Performance Optimization**: Utilizes `React.memo`, `useMemo`, `useCallback`, virtualized data tables, debounced scrolling, and optimized build configurations (Vite, esbuild) for enhanced performance and reduced bundle sizes.
-   **Accessibility**: Adheres to WCAG AA compliance with comprehensive ARIA attributes, keyboard navigation, focus management, and color contrast adherence.
-   **Error Handling**: Implemented robust error recovery with `AbortController` support, context-aware retry buttons, and structured logging.
-   **Data Processing**: Features robust data preprocessing for real-world datasets, including null handling, imputation, and mixed data type support, alongside Zod for schema validation.
-   **ML Workflow Automation**: Integrates intelligent action detection within the chat interface to automatically parse AI responses and trigger ML workflow steps.
-   **CI/CD**: Employs GitHub Actions for automated linting, testing, security scanning, and deployment to Vercel and Render.
-   **Three-Panel Layout**: Utilizes `react-resizable-panels` for an optimized horizontal three-panel layout (Data Management, Chat Panel, Results Panel) with adjustable sizes.

### Key Components
-   **Machine Learning Platform**: Handles data management (CSV/Excel), model training (Linear Regression, Random Forest, etc.), convergence monitoring, and visualization. Includes Fairlearn for bias detection.
-   **Bioimpedance Analysis System**: Provides real-time calculations, multi-species support, and body composition analysis.
-   **Mathematical Frameworks Engine**: Includes Bayesian inference, game theory analysis, chaos theory, and convergence prediction.
-   **Conversational AI Interface**: Offers natural language processing, context-aware responses, multi-turn conversations, and fallback systems. Integrates with local LLMs and OpenAI ChatGPT.
-   **Report Generation**: Generates comprehensive, consultant-grade reports (15-20 pages) with embedded visuals, authentic statistical analysis, and dual-format support (Word/PowerPoint).
-   **Watson-like AI Capabilities**: Integrates CPU-optimized NLP, Vision, and Speech processing, along with AI governance features (bias, fairness, explainability) and model deployment.

## External Dependencies

-   **Frontend**: React (18), Vite, Tailwind CSS, Recharts, Shadcn/ui, Radix UI, Lucide React, React Resizable Panels, React Hot Toast, React Markdown, react-window.
-   **Backend**: Node.js, Express.js, Drizzle ORM (PostgreSQL), Passport.js, bcrypt, Multer.
-   **Data Processing**: PapaParse, js-yaml, xml2js, JSZip, Zod.
-   **AI/ML**: OpenAI API (optional), Hugging Face Transformers.js (for local LLMs like Phi-3-mini), Fairlearn (for bias detection), scikit-learn (via Python subprocess).
-   **Development/Testing**: TypeScript, Jest, Drizzle Kit, ESLint, concurrently, electron-builder.
-   **Third-Party Services**: DuckDuckGo Instant Answer API.