# Demo Better Next

A modern Next.js starter template featuring robust authentication, multi-tenancy, and a dynamic Role-Based Access Control (RBAC) system.

## 🚀 Overview

This project demonstrates a sophisticated integration of [Better Auth](https://www.better-auth.com/) with [Next.js](https://nextjs.org/) and [Drizzle ORM](https://orm.drizzle.team/), providing a solid foundation for SaaS applications that require organizational isolation and granular permission management.

## 🛠 Tech Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router, React 19)
- **Auth:** [Better Auth](https://www.better-auth.com/) with Organization plugin
- **Database:** SQLite via [@libsql/client](https://github.com/tursodatabase/libsql-client-ts)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (Radix UI)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Form Handling:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Testing:** [Vitest](https://vitest.dev/)

## ✨ Key Features

- **Authentication:** Secure email/password login powered by Better Auth.
- **Multi-tenancy:** Built-in support for organizations, members, and invitations.
- **Dynamic RBAC:** A custom RBAC system that extends Better Auth's base roles with granular permissions.
- **Organization Isolation:** Middleware-enforced organization selection and isolation.
- **Admin Console:** User management interface for managing organization members and their roles.
- **Responsive Design:** Fully responsive UI with dark mode support.

## 🚦 Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (recommended)

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Environment Setup

Create a `.env` file in the root directory and add the following:

```env
BETTER_AUTH_SECRET=your_secret_here
BETTER_AUTH_URL=http://localhost:3000
```

### Database Initialization

1. Sync the database schema:
   ```bash
   pnpm exec drizzle-kit push
   ```

2. Seed the RBAC roles and permissions:
   ```bash
   pnpm exec tsx lib/db/seed-rbac.ts
   ```

### Running the App

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## 🔐 RBAC System

The project implements a layered RBAC system:

1. **Better Auth Roles:** Uses the standard `Admin`, `Member` roles from Better Auth.
2. **Custom Permissions:** Granular permissions (e.g., `user.create`, `user.update`, `org.update`) are stored in the `permission` table.
3. **Role-Permission Mapping:** Roles are associated with specific permissions via the `role_permission` table.
4. **Member Roles:** Members can be assigned multiple roles, which are aggregated to resolve their effective permissions.

Default seeded roles:
- **Admin:** Full access to all features and organization settings.
- **Manager:** Can manage users and view organization data.
- **User:** Read-only access to organization data.

## 📂 Project Structure

- `app/`: Next.js App Router routes and server actions.
- `components/`: React components, including Shadcn UI primitives.
- `lib/`: Core utilities, including auth configuration, database schema, and RBAC logic.
- `drizzle/`: Database migrations and configuration.
- `tests/`: Vitest test suites.

## 📜 Scripts

- `pnpm dev`: Runs the app in development mode.
- `pnpm build`: Builds the app for production.
- `pnpm start`: Starts the production server.
- `pnpm lint`: Runs ESLint for code quality checks.
- `pnpm test`: Runs the test suite using Vitest.

## 🧪 Testing

The project uses Vitest for unit and integration testing. Run tests with:

```bash
pnpm test
```
