A comprehensive system for managing visitor registrations for Digital Group events.

## Database Information
- **Database Name:** `digital_group_events`
- **Connection:** MySQL

## System Requirements
- **PHP:** ^8.2
- **Node.js:** Latest LTS recommended
- **Composer:** For backend dependencies
- **MySQL:** Database server

## Setup Instructions

### 1. Database Setup
Create the database in your MySQL environment:
```sql
CREATE DATABASE digital_group_events;
```

### 2. Backend Configuration
Navigate to the `backend` directory:
```bash
cd backend
```

Install PHP dependencies:
```bash
composer install
```

Set up your environment file:
```bash
cp .env.example .env
```
Ensure the DB credentials in `.env` match your local setup:
```env
DB_DATABASE=digital_group_events
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

Generate the application key:
```bash
php artisan key:generate
```

Run database migrations:
```bash
php artisan migrate
```

### 3. Frontend Configuration
Navigate to the `frontend` directory:
```bash
cd frontend
```

Install Javascript dependencies:
```bash
npm install
```

## Running the Application

### Option A: Integrated Development Mode (Recommended)
From the **backend** directory, you can run both the server and the frontend simultaneously:
```bash
cd backend
composer dev
```
*This command uses `concurrently` to start the Laravel server, queue listener, and Vite development server.*

### Option B: Running Separately

**Start Backend Server:**
```bash
cd backend
php artisan serve
```

**Start Frontend Development Server:**
```bash
cd frontend
npm run dev
```

## Relevant Commands

| Command | Location | Description |
|---------|----------|-------------|
| `composer dev` | `backend/` | Starts backend server, queue, and frontend dev server |
| `php artisan migrate` | `backend/` | Runs database migrations |
| `php artisan db:seed` | `backend/` | (Optional) Seeds the database with initial data |
| `npm run dev` | `frontend/` | Starts the Vite development server |
| `npm run build` | `frontend/` | Builds the frontend for production |

