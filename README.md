# InvoiceFlow - SaaS Invoicing & Accounting Web App

A modern, full-featured invoicing and small business accounting application built with React, Node.js, and MySQL. Inspired by MyBillBook, this application provides comprehensive business management tools for small businesses.

## Features

### Core Functionality
- **User Management**: JWT-based authentication with signup/login/logout
- **Customer Management**: Create, edit, and manage customer information
- **Product/Service Inventory**: Track products with SKU, pricing, and stock management
- **Invoice Management**: 
  - Create, edit, and manage invoices with automatic numbering (INV-{YYYY}{MM}-{sequence})
  - Multiple statuses: Draft → Issued → Paid → Cancelled
  - PDF export with professional templates
- **Payment Tracking**: Record payments and automatically update invoice status
- **Expense Management**: Track business expenses by category
- **Financial Reports**: Profit & Loss statements with date range filtering
- **Dashboard**: Key metrics, recent activity, and low-stock alerts

### Business Features
- Single-company per account (no multi-tenant)
- Automatic invoice numbering with monthly sequence reset
- Stock management with optional negative stock allowance
- Currency support (USD/INR toggle)
- Tax calculation (GST/VAT support)
- Professional PDF invoice generation

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with Shadcn/UI components
- **Wouter** for client-side routing
- **React Query** for API state management
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express and TypeScript
- **MySQL** database with Prisma ORM
- **JWT** authentication with refresh tokens
- **bcrypt** for password hashing
- **Puppeteer** for PDF generation
- **Express Rate Limiting** for security

## Getting Started

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invoiceflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   DATABASE_URL="mysql://username:password@host:3306/database_name"
   JWT_SECRET="your-strong-jwt-secret"
   JWT_REFRESH_SECRET="your-strong-refresh-secret"
   ```

### Database Setup

1. **Create MySQL database**
   ```sql
   CREATE DATABASE invoiceflow;
   ```

2. **Run database migrations**
   ```bash
   npm run db:push
   ```

3. **Seed the database with sample data**
   ```bash
   npm run seed
   ```

### Running the Application

#### Development
```bash
npm run dev
