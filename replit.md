# Rithm Enterprise AI Platform

## Overview
The Rithm Enterprise AI Platform is a comprehensive AI solution designed for enterprise use, integrating machine learning convergence monitoring, bioimpedance analysis, advanced mathematical frameworks, and conversational AI. Its primary purpose is to make advanced AI accessible across various deployment environments (Replit, Windows, web) for data analysis, model training, and professional report generation. The project aims to provide enterprise-grade security and robust handling of real-world data, with a vision for broad market potential and high ambitions in the AI domain.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React, utilizing Vite for development and Tailwind CSS for styling, supporting responsive design and a dark theme. UI components are built using Shadcn/ui for consistency. It supports multiple interface approaches, including standalone HTML with embedded React via CDN.

### Backend Architecture
The backend is powered by Node.js/Express, designed for various server configurations including a main API server for ML operations and specialized standalone servers. It adheres to a RESTful API design and manages data through local file storage.

### Key Architectural Decisions
-   **Multi-Interface Strategy**: Supports React applications, standalone HTML, and Windows executables for maximum compatibility and deployment flexibility.
-   **Mathematical Framework Integration**: Encapsulates complex mathematical engines within conversational wrappers for accessibility.
-   **Component Modularization**: Focuses on breaking down components into smaller, modular units for maintainability and scalability.
-   **State Management**: Centralized state management is achieved using Zustand.
-   **Local AI Integration**: Leverages CPU-based local AI models (e.g., Phi-3-mini) for offline capabilities.
-   **Dual-Interface Report Editing**: Supports both conversational AI-driven editing and a visual editor for reports, with a structured JSON action dispatch system.
-   **Security Architecture**: Implements comprehensive security measures including file size limits, client-side validation, enhanced privacy warnings, enterprise authentication (Passport.js with bcrypt), and modern security headers (CSP).
-   **Performance Optimization**: Utilizes React.memo, useMemo, useCallback, virtualized data tables, debounced scrolling, and optimized build configurations (Vite, esbuild).
-   **Accessibility**: Adheres to WCAG AA compliance with ARIA attributes, keyboard navigation, focus management, and color contrast.
-   **Error Handling**: Implemented robust error recovery with AbortController, context-aware retry mechanisms, and structured logging.
-   **Data Processing**: Features robust data preprocessing for real-world datasets, including null handling, imputation, and mixed data type support, alongside Zod for schema validation.
-   **ML Workflow Automation**: Integrates intelligent action detection within the chat interface to automatically parse AI responses and trigger ML workflow steps.
-   **CI/CD**: Employs GitHub Actions for automated linting, testing, security scanning, and deployment.
-   **Three-Panel Layout**: Utilizes `react-resizable-panels` for an optimized horizontal three-panel layout (Data Management, Chat Panel, Results Panel).

### Key Components
-   **Machine Learning Platform**: Handles data management, model training (e.g., Linear Regression, Random Forest), convergence monitoring, and visualization, including bias detection with Fairlearn.
-   **Bioimpedance Analysis System**: Provides real-time calculations, multi-species support, and body composition analysis.
-   **Mathematical Frameworks Engine**: Includes Bayesian inference, game theory analysis, chaos theory, and convergence prediction.
-   **Conversational AI Interface**: Offers natural language processing, context-aware responses, multi-turn conversations, and fallback systems, integrating with local LLMs and OpenAI ChatGPT.
-   **Report Generation**: Generates comprehensive, consultant-grade reports (15-20 pages) with embedded visuals, authentic statistical analysis, and dual-format support.
-   **Watson-like AI Capabilities**: Integrates CPU-optimized NLP, Vision, and Speech processing, along with AI governance features (bias, fairness, explainability) and model deployment.

## External Dependencies

-   **Frontend**: React, Vite, Tailwind CSS, Recharts, Shadcn/ui, Radix UI, Lucide React, React Resizable Panels, React Hot Toast, React Markdown, react-window.
-   **Backend**: Node.js, Express.js, Drizzle ORM (PostgreSQL), Passport.js, bcrypt, Multer.
-   **Data Processing**: PapaParse, js-yaml, xml2js, JSZip, Zod.
-   **AI/ML**: OpenAI API (optional), Hugging Face Transformers.js (for local LLMs like Phi-3-mini), Fairlearn, scikit-learn (via Python subprocess).
-   **Development/Testing**: TypeScript, Jest, Drizzle Kit, ESLint, concurrently, electron-builder.
-   **Third-Party Services**: DuckDuckGo Instant Answer API.
