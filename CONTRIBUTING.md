# Contributing to GNB Transfer

Thank you for your interest in contributing to GNB Transfer! This document provides guidelines and best practices for contributing to the project.

## 🔒 Security Guidelines

### **CRITICAL: Never Commit Secrets**

**DO NOT commit sensitive information to the repository:**
- Environment variables (`.env` files)
- API keys, tokens, or passwords
- Database connection strings
- JWT secrets
- Private keys or certificates
- Customer data or PII

### Pre-Commit Checklist

Before committing, verify:
1. ✅ No `.env` files are staged for commit
2. ✅ No hardcoded secrets in code (use environment variables)
3. ✅ No sensitive data in logs or comments
4. ✅ Run `git diff --cached` to review staged changes

### CI Security Checks

Our CI pipeline automatically checks for:
- Exposed secrets (MONGO_URI, JWT_SECRET, API keys)
- Environment files in commits
- High-severity security vulnerabilities

**Commits containing secrets will be blocked.**

### If You Accidentally Commit Secrets

1. **DO NOT** just delete the file in a new commit
2. Immediately contact the maintainers
3. Follow the secret rotation procedure in `ops/rotate-secrets.sh`
4. Secrets in git history remain accessible and must be rotated

## 📋 Development Guidelines

### Code Style

- Follow existing patterns in the codebase
- Use ES Modules (`import/export`) syntax
- Backend: Use `.mjs` extensions for all new files
- Frontend: Use functional React components with hooks
- Add JSDoc comments for complex functions
- Keep functions small and focused (single responsibility)

### Testing

- Write tests for new features and bug fixes
- Run `npm test` before submitting PRs
- Ensure test coverage doesn't decrease
- Test both success and error scenarios

### Security Best Practices

1. **Input Validation**: Validate all user inputs
2. **SQL/NoSQL Injection**: Use parameterized queries, never interpolate user input
3. **Authentication**: Use JWT tokens with short expiration
4. **Authorization**: Check user roles before allowing actions
5. **Rate Limiting**: Apply rate limits to all public endpoints
6. **CORS**: Whitelist only trusted origins
7. **Logging**: Never log sensitive data (passwords, tokens, credit cards)
8. **Dependencies**: Keep dependencies updated, run `npm audit` regularly

### Environment Variables

Use `.env.example` as a template:
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your local values
```

**Never commit actual `.env` files.**

## 🚀 Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linter: `npm run lint:fix`
5. Run tests: `npm test`
6. Commit with conventional commit messages:
   - `feat: add new feature`
   - `fix: resolve bug`
   - `security: fix vulnerability`
   - `perf: improve performance`
   - `docs: update documentation`
7. Push to your fork
8. Open a Pull Request

### PR Requirements

- ✅ All CI checks pass (lint, tests, security scan)
- ✅ No merge conflicts
- ✅ Description explains what and why
- ✅ Tests included for new features/fixes
- ✅ No secrets or sensitive data committed

## 🔐 Security Vulnerabilities

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Email security@gnbtransfer.com (or repository maintainer)
3. Provide detailed description and steps to reproduce
4. Wait for acknowledgment before public disclosure

## 📝 Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `security`: Security fix
- `perf`: Performance improvement
- `refactor`: Code refactoring
- `docs`: Documentation
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat(booking): add vehicle availability check
fix(auth): resolve token expiration bug
security(cors): lock down CORS origins for production
perf(tours): eliminate N+1 queries with aggregation
```

## 🤝 Code Review

All PRs require:
- At least one approval from maintainers
- All CI checks passing
- No unresolved comments

## 📚 Additional Resources

- [README.md](README.md) - Project overview
- [backend/README.md](backend/README.md) - Backend documentation
- [API Documentation](backend/SECURITY_API_DOCS.md) - API security docs
- [ops/rotate-secrets.sh](ops/rotate-secrets.sh) - Secret rotation guide

## Questions?

Open a discussion in the GitHub repository or contact the maintainers.

Thank you for contributing! 🎉
