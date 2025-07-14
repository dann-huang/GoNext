# GoNext: A Real-time Full-Stack Web Application based on Go and Next.js

[![GitHub Actions CI Status](https://github.com/dann-huang/gonext/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/dann-huang/gonext/actions/workflows/pr-checks.yml)
[![GitHub Actions Deployment Status](https://github.com/dann-huang/gonext/actions/workflows/build-n-deploy.yml/badge.svg)](https://github.com/dann-huang/gonext/actions/workflows/build-n-deploy.yml)

GoNext is a personal project and portfolio piece showcasing a full-stack web application designed for interactive, real-time experiences. It highlights expertise in modern backend (Go), frontend (Next.js), and robust containerized deployment with Docker, Nginx, PostgreSQL, and Redis.

**Live Demo:** [https://daniel-h.ca](https://daniel-h.ca) (If actively deployed and available)

---

## Table of Contents

* [Features](#features)
* [Project Roadmap](#project-roadmap)
* [Tech Stack](#tech-stack)
* [Architecture](#architecture)
* [Getting Started](#getting-started)
    * [Prerequisites](#prerequisites)
    * [Local Development Setup](#local-development-setup)
* [CI/CD and Deployment](#cicd-and-deployment)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)

---

## Features

This project emphasizes real-time interactivity and robust architecture, demonstrating key full-stack capabilities:

* **Full-Stack Architecture:** A high-performance Go backend seamlessly integrated with a modern, reactive Next.js and TypeScript frontend.
* **Real-time Communication:** Custom WebSocket implementations power all interactive features.
* **Text Chat:** Instant, real-time text communication between users.
* **Video Chat:** Integrating WebRTC for peer-to-peer video communication.
* **Collaborative Drawing Canvas:** A shared, interactive canvas where multiple users can draw together in real-time.
* **Singleplayer Games:** Currently just minesweeper, but more to come!
* **Multiplayer Games:** Implementing classic real-time board games like Chess or Connect Four.

* **User Authentication:** Secure user registration and login using JSON Web Tokens (JWT).
* **Containerized Environment:** The entire application stack (frontend, backend, database, cache, proxy) is orchestrated using Docker Compose for consistent local development and production environments.
* **Automated Deployment:** Features a robust CI/CD pipeline for automatic deployment to `daniel-h.ca`.

---

## Project Roadmap
GoNext is a continually evolving personal project. Planned enhancements include:

* **More single player games:** Planning Sudoku incl. solver and variants
* **More multipleayer games:** Planning card and board games, once I bite the bullet and get the UX sorted out. 
* **User Features:** Persistant user profiles, friend lists, more direct ways to play with them etc.

---

## Tech Stack

### Backend
* **Go:** Core application logic and WebSocket server.
    * **Routing:** [`chi/v5`](https://github.com/go-chi/chi)
    * **Authentication:** [`golang-jwt/jwt/v5`](https://github.com/golang-jwt/jwt)
    * **WebSockets:** [`coder/websocket`](https://github.com/coder/websocket)
    * **Database Client:** [`lib/pq`](https://github.com/lib/pq) for PostgreSQL interactions
    * **Redis Client:** [`go-redis`](https://github.com/go-redis/redis) for cache and pub/sub functionality
* **PostgreSQL:** Primary relational database for persistent data storage.
* **Redis:** In-memory data store used for caching, real-time message broadcasting (Pub/Sub), and session management.

### Frontend
* **Next.js:** React framework for server-side rendering, routing, and efficient frontend development.
* **React:** Core UI library.
* **TypeScript:** For enhanced code quality and type safety.
* **State Management:** [`Zustand`](https://zustand-store.github.io/)
* **Styling:** [`Tailwind CSS`](https://tailwindcss.com/)
* **Animation:** [`Framer Motion`](https://www.framer.com/motion/)

### Infrastructure & Containerization
* **Nginx:** High-performance web server acting as a reverse proxy for both frontend and backend services.
* **Docker:** For containerizing individual services.
* **Docker Compose:** For orchestrating the multi-container application stack locally.

---

## Architecture

GoNext employs a fully containerized, microservices-oriented architecture. Nginx serves as the entry point, routing requests to the Next.js frontend or the Go backend. The Go backend interacts with PostgreSQL for persistent data and Redis for real-time messaging and caching. All components are defined and orchestrated via Docker Compose.

---

## Getting Started

This section provides instructions for setting up the project for local development.

### Prerequisites

- Docker and Docker Compose
- Go (version 1.21 or higher)
- Node.js (version 18 or higher)

### Local Development Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/dann-huang/gonext.git
    cd gonext
    ```

2.  **Run the application:**
    ```sh
    docker-compose up --build
    ```

This will build the Docker images and start all services. The frontend will be available at `http://localhost`.

---

## CI/CD and Deployment

This project uses GitHub Actions for continuous integration and deployment. The workflow is defined in `.github/workflows/`:

-   `pr-checks.yml`: Runs on every pull request to ensure that the frontend and backend Docker images can be built successfully.
-   `build-n-deploy.yml`: Deploys the application to the production server upon a push to the `main` branch.

