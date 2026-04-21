/**
 * User Routes - Module Structure
 * 
 * User management for all roles (student/driver/admin)
 */

import { Router } from 'express';

const router = Router();

// Routes to be implemented:
// GET    /api/v1/users              - List users (admin)
// GET    /api/v1/users/:id          - Get user by ID
// PUT    /api/v1/users/:id          - Update user profile
// DELETE /api/v1/users/:id          - Delete user (admin)
// GET    /api/v1/users/:id/profile  - Get full profile with role data

export { router as userRoutes };
