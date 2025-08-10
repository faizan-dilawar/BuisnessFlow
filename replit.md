# InvoiceFlow - SaaS Invoicing & Accounting Web App

## Overview

InvoiceFlow is a modern, full-featured invoicing and small business accounting application built with React, Node.js, and PostgreSQL (using Drizzle ORM). The application provides comprehensive business management functionality including customer management, product inventory tracking, invoice generation with PDF export, payment tracking, expense management, and financial reporting. The system is designed as a single-company per account solution (non-multi-tenant) with JWT-based authentication and professional invoice generation capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern development
- **Vite** for fast development builds and hot module replacement
- **Tailwind CSS** with Shadcn/UI components for consistent, modern design system
- **Wouter** for lightweight client-side routing instead of React Router
- **React Query** (@tanstack/react-query) for server state management and caching
- **React Hook Form** with Zod validation for form handling and validation
- Component-based architecture with clear separation between UI components, pages, and business logic
- Responsive design with mobile-first approach using Tailwind breakpoints

### Backend Architecture
- **Node.js** with Express and TypeScript for the REST API server
- **Drizzle ORM** configured for PostgreSQL database operations
- **JWT authentication** with access and refresh token strategy
- **bcrypt** for secure password hashing
- **Express Rate Limiting** for API security and abuse prevention
- RESTful API design with consistent error handling and response formatting
- Modular service layer for business logic separation (auth, PDF generation, storage)
- Middleware-based request processing with authentication guards

### Data Storage Solutions
- **PostgreSQL** as the primary database (configured via Drizzle)
- **Drizzle ORM** for type-safe database operations and migrations
- Database schema includes: users, companies, customers, products, invoices, invoice items, payments, expenses, and counters
- Foreign key relationships ensuring data integrity
- Optimized queries for dashboard analytics and reporting features

### Authentication and Authorization
- **JWT-based authentication** with separate access (15min) and refresh (7 days) tokens
- **bcrypt password hashing** with salt rounds for security
- **Token-based authorization** middleware protecting API endpoints
- **Rate limiting** on authentication endpoints to prevent brute force attacks
- Session management through localStorage on client-side
- Automatic token refresh mechanism for seamless user experience

### Business Logic Features
- **Automatic invoice numbering** with monthly sequence reset (INV-{YYYY}{MM}-{sequence})
- **Invoice lifecycle management** (Draft → Issued → Paid → Cancelled)
- **Stock management** with optional negative stock allowance
- **Multi-currency support** (USD/INR with toggle capability)
- **Tax calculation** supporting GST/VAT
- **PDF generation** using Puppeteer for professional invoice documents
- **Financial reporting** with P&L statements and date range filtering

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless** - PostgreSQL database driver for serverless environments
- **drizzle-orm** and **drizzle-kit** - Type-safe ORM and migration tools
- **express** - Web application framework for Node.js
- **puppeteer** - PDF generation for invoice exports
- **bcrypt** - Password hashing library
- **jsonwebtoken** - JWT token generation and verification

### Frontend UI Dependencies
- **@radix-ui** components - Accessible UI primitives (dialogs, dropdowns, forms, etc.)
- **@tanstack/react-query** - Server state management and caching
- **@hookform/resolvers** - Form validation resolvers
- **react-hook-form** - Form handling library
- **zod** - Schema validation library
- **wouter** - Lightweight routing library
- **date-fns** - Date manipulation utilities

### Development and Build Tools
- **vite** - Build tool and development server
- **typescript** - Type checking and compilation
- **tailwindcss** - Utility-first CSS framework
- **postcss** and **autoprefixer** - CSS processing
- **tsx** - TypeScript execution for Node.js development

### Database and Configuration
- **connect-pg-simple** - PostgreSQL session store
- **drizzle-zod** - Zod schema generation from Drizzle schemas
- Environment variable configuration for database connections and secrets
- Replit-specific development banner integration

The application is designed to run on Replit with PostgreSQL database provisioning through environment variables, making it easily deployable and scalable for small business accounting needs.