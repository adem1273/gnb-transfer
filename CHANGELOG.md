# Changelog

All notable changes to the GNB Transfer project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-29

### Added
- Strong password validation (8+ chars, uppercase, lowercase, number)
- Database connection retry logic with configurable attempts
- Centralized constants file for limits and configuration
- CHANGELOG.md for version tracking

### Changed
- Refresh token lookup optimized from O(n) to O(1)
- JWT_SECRET now required (server won't start without it in production)
- Password minimum length increased from 6 to 8 characters
- Console.error replaced with logger.error throughout codebase
- Analytics queries optimized with MongoDB aggregation

### Fixed
- Rate limiting added to coupon validation endpoint
- N+1 query issue in admin analytics resolved

### Security
- Brute-force protection for coupon code validation
- Stronger password policy enforcement
- JWT secret validation at startup

## [1.0.0] - 2025-11-01

### Added
- Initial release
- User authentication with JWT and refresh tokens
- Tour management system
- Booking system with status tracking
- Admin dashboard with analytics
- Driver panel
- Vehicle management
- Coupon and discount system
- Multi-language support (Turkish/English)
- Email notifications
- Rate limiting and security headers
