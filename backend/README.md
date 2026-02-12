# BillNet Backend API

Investment platform backend built with Node.js, Express, and PostgreSQL.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Make sure PostgreSQL is running, then create the database:

```bash
psql -U postgres
CREATE DATABASE billnet;
\q
```

Run the database schema:

```bash
psql -U postgres -d billnet -f database.sql
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and update the values:

```bash
copy .env.example .env
```

Edit `.env` with your actual database credentials and JWT secret.

### 4. Start the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- **POST** `/api/auth/signup` - Create new account
  - Body: `{ firstName, lastName, email, password, role }`
  
- **POST** `/api/auth/signin` - Sign in
  - Body: `{ email, password }`

### User Profile (Protected)

- **GET** `/api/user/profile` - Get user profile
  - Headers: `Authorization: Bearer <token>`
  
- **PUT** `/api/user/profile` - Update profile
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ firstName, lastName }`
  
- **POST** `/api/user/change-password` - Change password
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ currentPassword, newPassword }`

### Health Check

- **GET** `/` - API health check

## Database Schema

- **users** - User accounts (entrepreneurs & investors)
- **ideas** - Business ideas posted by entrepreneurs
- **investments** - Investment records
- **messages** - User-to-user messaging
- **saved_ideas** - Bookmarked ideas

## Technologies

- Express.js - Web framework
- PostgreSQL - Database
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- CORS - Cross-origin resource sharing
