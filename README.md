# Candidate Assignment

This project contains a full-stack application with separate backend and frontend folders.

## Project Structure
- `backend/` — Node.js Express backend API. See `backend/README.md` for setup and usage instructions.
- `frontend/` — Vite + React frontend. See `frontend/README.md` for setup and usage instructions.

## What Has Been Done
- **Backend**: Minimal Express server with API endpoints, environment variable support, and basic structure for middlewares and services.
- **Frontend**: Vite + React app with basic routing, authentication (including OTP), and reusable components.
- **Testing**: Complete test suites for both backend and frontend with all tests passing.
- Each folder contains its own README with detailed setup instructions.

## Testing
Both backend and frontend have comprehensive test suites:

### Backend Tests
- **Framework**: Jest with Supertest
- **Coverage**: API endpoints, middleware validation, error handling
- **Run tests**: `cd backend && npm test`
- **Status**: ✅ All tests passing (7 tests)

### Frontend Tests  
- **Framework**: Vitest with React Testing Library
- **Coverage**: Component rendering, basic functionality, environment setup
- **Run tests**: `cd frontend && npm test`
- **Status**: ✅ All tests passing (9 tests)

## Known Issues
- **OTP Sync Time Lag**: There may be a time lag in OTP synchronization. This can cause the frontend to show an error message even if the user is actually authenticated.

## Future Improvements
- Improve OTP synchronization and error handling for a smoother user experience.
- Add more robust validation and error messages.
- Implement end-to-end tests for both frontend and backend.
- Enhance security and environment configuration.
- Add CI/CD pipeline for automated testing and deployment.

---

For more details, refer to the individual `README.md` files in the `backend` and `frontend` folders.
