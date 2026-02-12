# BillNet Backend API Specification

This document outlines the required API endpoints for the BillNet backend to work with the frontend.

## Base URL
```
http://localhost:5000
```

## Database Configuration
- **Database:** billnet
- **User:** postgres
- **Password:** !!@@Root@2009
- **Type:** PostgreSQL

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('entrepreneur', 'investor')),
  profileComplete BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Ideas Table
```sql
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  fundingGoal DECIMAL(12, 2),
  currentFunding DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Investments Table
```sql
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ideaId UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  investorId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  equity DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senderId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipientId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Authentication Endpoints

#### 1. Sign Up
```
POST /api/auth/signup
Content-Type: application/json

Request Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "role": "entrepreneur" // or "investor"
}

Response (201):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "entrepreneur",
    "createdAt": "2026-01-21T10:00:00Z"
  }
}

Error Response (400):
{
  "success": false,
  "message": "Email already exists"
}
```

#### 2. Sign In
```
POST /api/auth/signin
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "entrepreneur"
  }
}

Error Response (401):
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### 3. Logout
```
POST /api/auth/logout
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

### User Endpoints

#### 4. Get User Profile
```
GET /api/user/profile
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "entrepreneur",
    "profileComplete": false,
    "createdAt": "2026-01-21T10:00:00Z"
  }
}

Error Response (401):
{
  "success": false,
  "message": "Unauthorized"
}
```

#### 5. Update User Profile
```
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Entrepreneur and tech enthusiast"
}

Response (200):
{
  "success": true,
  "data": { user object }
}
```

#### 6. Change Password
```
POST /api/user/password
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}

Response (200):
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Ideas Endpoints (Entrepreneurs)

#### 7. Create Idea
```
POST /api/ideas
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "title": "AI-Powered Learning Platform",
  "description": "An innovative platform using AI for personalized learning",
  "category": "EdTech",
  "fundingGoal": 500000
}

Response (201):
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "AI-Powered Learning Platform",
    "description": "...",
    "fundingGoal": 500000,
    "currentFunding": 0,
    "status": "active",
    "createdAt": "2026-01-21T10:00:00Z"
  }
}
```

#### 8. Get All Ideas
```
GET /api/ideas?page=1&limit=10&role=entrepreneur
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    { idea object },
    { idea object }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

#### 9. Get Single Idea
```
GET /api/ideas/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": { idea object }
}
```

#### 10. Update Idea
```
PUT /api/ideas/:id
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "title": "Updated Title",
  "description": "Updated description",
  "fundingGoal": 600000
}

Response (200):
{
  "success": true,
  "data": { updated idea object }
}
```

#### 11. Delete Idea
```
DELETE /api/ideas/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Idea deleted successfully"
}
```

### Investment Endpoints (Investors)

#### 12. Create Investment
```
POST /api/investments
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "ideaId": "550e8400-e29b-41d4-a716-446655440001",
  "amount": 50000,
  "equity": 5
}

Response (201):
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "ideaId": "550e8400-e29b-41d4-a716-446655440001",
    "investorId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 50000,
    "equity": 5,
    "status": "pending",
    "createdAt": "2026-01-21T10:00:00Z"
  }
}
```

#### 13. Get Investments
```
GET /api/investments?page=1&limit=10
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [{ investment object }],
  "pagination": { pagination info }
}
```

### Messaging Endpoints

#### 14. Send Message
```
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "recipientId": "550e8400-e29b-41d4-a716-446655440003",
  "content": "I'm interested in your AI project!"
}

Response (201):
{
  "success": true,
  "data": { message object }
}
```

#### 15. Get Messages
```
GET /api/messages?page=1&limit=20
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [{ message object }],
  "pagination": { pagination info }
}
```

#### 16. Get Conversation
```
GET /api/messages/conversation/:userId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    { messages between current user and userId }
  ]
}
```

## Error Handling

All endpoints return standard error responses:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Authentication

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

JWT Token Format:
```
Header: { alg: "HS256", typ: "JWT" }
Payload: { userId, role, iat, exp }
Secret: <YOUR_SECRET_KEY>
```

## CORS Configuration

Enable CORS for frontend:
```
Origin: http://localhost:5173
Methods: GET, POST, PUT, DELETE, OPTIONS
Headers: Content-Type, Authorization
Credentials: true
```

## Rate Limiting (Recommended)

Implement rate limiting:
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

## Testing

Use tools like Postman or cURL to test endpoints:

```bash
# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "role": "entrepreneur"
  }'

# Get profile
curl -X GET http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer <token>"
```

## Next Steps

1. Implement database schema
2. Create API routes
3. Add JWT authentication
4. Implement database queries
5. Add input validation
6. Setup error handling
7. Enable CORS
8. Deploy to production

---

**Last Updated:** January 21, 2026
