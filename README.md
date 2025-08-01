# Let's Eat Monorepo
Dit is even een probeersel van de lets eat layout zoals ik hem voor mij zie hoe het makkelijk in 1 repository gedaan kan worden.


This repository contains the codebase for the "Let's Eat" project, structured as a monorepo using [TurboRepo](https://turbo.build/). It includes multiple applications and shared packages.

## Project Structure

The monorepo is organized into two main directories:

-   `apps/`: Contains all the individual applications.
    -   `admin-web`: Admin web application (Next.js).
    -   `backend`: Backend API (NestJS).
    -   `restaurant-web`: Restaurant-facing web application (Next.js).
    -   `web`: General web application (Next.js).


## Technologies Used

-   **Monorepo Management:** TurboRepo
-   **Backend:** NestJS (TypeScript)
-   **Web Applications:** Next.js (React, TypeScript)
-   **Database ORM:** Prisma

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd letseat
    ```
2.  **Install dependencies:**
    Use your preferred package manager. This project uses `npm`.
    ```bash
    npm install
    ```

## Running Applications

You can run individual applications or multiple applications concurrently using TurboRepo.

-   **Run all web applications:**
    ```bash
    npm run dev --filter="apps/*-web"
    ```
-   **Run the backend:**
    ```bash
    npm run dev --filter=apps/backend
    ```
-   **Run a specific application (e.g., user-web):**
    ```bash
    npm run dev --filter=apps/user-web
    ```

Refer to the individual `package.json` files within each app directory for specific scripts.

## Building Applications

To build all applications:

```bash
npm run build
```

To build a specific application (e.g., backend):

```bash
npm run build --filter=apps/backend
```

## Linting and Formatting

This project uses ESLint and Prettier for linting and formatting.

-   **Lint all projects:**
    ```bash
    npm run lint
    ```
-   **Format all projects:**
    ```bash
    npm run format
    ```

## Using Prisma

Prisma is used as the database ORM for this project. Below are some common commands to get started:

-   **Generate Prisma Client:**
    ```bash
    npx prisma generate
    ```

-   **Run Migrations:**
    ```bash
    npx prisma migrate dev
    ```

-   **Open Prisma Studio:**
    ```bash
    npx prisma studio
    ```

Refer to the [Prisma documentation](https://www.prisma.io/docs) for more details.

## Contributing

(Add contributing guidelines here if applicable)

## License

(Add license information here)