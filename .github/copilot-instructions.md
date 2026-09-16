# Logistics Portal Project Instructions

## Project Overview

This is a professional logistics tracking portal with a frontend, backend API, shipment tracking, authentication, and an admin dashboard.

## Backend

- Backend code is located in the `backend/` directory.
- The backend uses Node.js and Express.
- Use CommonJS syntax.
- Keep API routes inside `backend/routes/`.
- Keep models inside `backend/models/`.
- Keep business logic inside `backend/services/`.
- Keep middleware inside `backend/middleware/`.
- Keep sensitive configuration in environment variables.
- Never hard-code passwords, JWT secrets, API keys, or credentials.

## Authentication

- Admin authentication uses JWT.
- Passwords must be hashed with bcrypt.
- Protected admin routes must verify JWT tokens.
- Never expose password hashes in API responses.
- Keep authentication logic secure and consistent.

## Shipments

- Tracking numbers should be normalized consistently.
- Validate shipment data before creating or updating shipments.
- Keep shipment business logic inside the shipment service.
- Public tracking endpoints must not expose private admin information.

## API

- Use appropriate HTTP status codes.
- Validate incoming request data.
- Return consistent JSON responses.
- Handle errors safely.
- Do not expose sensitive server information in error responses.

## Frontend

- Keep the interface professional, responsive, and mobile-friendly.
- Do not break existing tracking functionality when adding features.
- Reuse existing components and styles where practical.

## Security

- Never commit `.env` files or secrets.
- Use environment variables for deployment configuration.
- Never expose JWT secrets, passwords, API keys, or private credentials.

## Code Quality

- Prefer simple, maintainable solutions.
- Do not create duplicate files when an existing file can be updated.
- Check whether a file already exists before creating a new one.
- Preserve existing functionality.
- Keep changes focused on the requested task.
- Explain significant changes clearly.
