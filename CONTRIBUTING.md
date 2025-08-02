# Contributing to Rithm

Thank you for your interest in contributing to Rithm! This document provides guidelines for contributing to this project.

## Code of Conduct

This project adheres to a code of professional conduct. By participating, you are expected to uphold this standard.

## How to Contribute

### Reporting Issues

1. **Search existing issues** first to avoid duplicates
2. **Use the issue template** when creating new issues
3. **Provide detailed information**:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node.js version, etc.)
   - Screenshots if applicable

### Development Setup

1. **Fork the repository**
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
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow coding standards**
   - Use TypeScript for type safety
   - Follow ESLint configuration
   - Write meaningful commit messages
   - Add tests for new functionality

3. **Test your changes**
   ```bash
   npm run check    # TypeScript checks
   npm run build    # Production build test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Pull Request Process

1. **Update documentation** if needed
2. **Ensure all tests pass**
3. **Create a pull request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes
   - Testing instructions

4. **Address feedback** promptly and professionally

## Development Guidelines

### Code Style

- **TypeScript**: Use strict typing
- **React**: Use functional components with hooks
- **CSS**: Use Tailwind CSS classes
- **Backend**: Follow RESTful API conventions

### File Structure

```
src/
├── components/     # React components
├── pages/         # Page components
├── lib/           # Utility functions
├── hooks/         # Custom React hooks
└── types/         # TypeScript type definitions

server/
├── routes/        # API route handlers
├── middleware/    # Express middleware
└── utils/         # Server utilities

shared/
├── schema.ts      # Database schema
└── types.ts       # Shared types
```

### Commit Message Format

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or auxiliary tool changes

### Database Changes

1. **Update schema** in `shared/schema.ts`
2. **Run migration** with `npm run db:push`
3. **Test thoroughly** in development
4. **Document changes** in pull request

### API Changes

1. **Maintain backwards compatibility** when possible
2. **Update API documentation**
3. **Add appropriate error handling**
4. **Include input validation**

## Testing

### Running Tests
```bash
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
```

### Writing Tests
- Write unit tests for utilities and business logic
- Add integration tests for API endpoints
- Include component tests for complex UI components

## Documentation

### Updating Documentation
- Update README.md for user-facing changes
- Update DEPLOYMENT.md for deployment-related changes
- Add inline code comments for complex logic
- Update API documentation for endpoint changes

### Writing Documentation
- Use clear, concise language
- Include code examples
- Keep documentation up-to-date with code changes
- Use proper markdown formatting

## Release Process

1. **Version bump** following semantic versioning
2. **Update CHANGELOG.md**
3. **Create release notes**
4. **Tag the release**

## Getting Help

- **Documentation**: Check existing docs first
- **Issues**: Search existing issues for solutions
- **Discussions**: Use GitHub Discussions for questions
- **Community**: Join our community channels

## Recognition

Contributors will be recognized in:
- Repository contributors list
- Release notes for significant contributions
- Project documentation

Thank you for contributing to making this project better!