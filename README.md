# GeoLogic (AccessGate AI)

**Policy-driven location attestation (IP vs GPS) + VPN/proxy detection + explainable decisions + audit + monitoring**

This project ("AccessGate AI") is a modern location attestation system that goes beyond simple IP vs GPS matching. It implements a risk-scoring and policy engine to validate user locations for protected resources, detecting VPNs, proxies, and spoofing attempts.

## Architecture

- **Frontend**: Next.js (TypeScript), Tailwind, ShadCN UI
- **Backend**: FastAPI (Python), Pydantic, SQLAlchemy
- **Database**: PostgreSQL (via Docker)
- **Infrastructure**: Docker Compose

## Features

- **Location Validation**: Compares browser GPS with IP-based geolocation.
- **Risk Analysis**: Detects VPNs, proxies, and Tor usage (Mocked for MVP).
- **Policy Engine**: Admin-configurable rules for ALLOW/STEP_UP/DENY decisions.
- **Audit Trails**: Detailed logs of all attestations and decisions.
- **Admin Console**: Interface to manage policies and view audit logs.

## Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)

## Getting Started

### 1. Start Infrastructure (Database)

```bash
cd infra
docker-compose up -d
```

### 2. Setup Backend (API)

```bash
cd apps/api
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi "uvicorn[standard]" sqlalchemy pydantic psycopg2-binary alembic

# Run database migrations
alembic upgrade head

# Start API server
uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`. available at `http://localhost:8000/docs` (Swagger UI).

### 3. Setup Frontend (Web)

```bash
cd apps/web
# Install dependencies
npm install

# Start development server
npm run dev
```
The application will be available at `http://localhost:3000`.

## Usage

1.  **Validate Location**: Open `http://localhost:3000` and click "Validate Location". You will need to allow location access in your browser.
2.  **Admin Console**: Navigate to `http://localhost:3000/admin` to view the Dashboard.
    -   **Policies**: View and edit the JSON policy that drives decisions.
    -   **Audit Logs**: View a history of all attestation requests, including decisions and risk scores.

## Project Structure

```
geologic/
├── apps/
│   ├── web/              # Next.js Frontend
│   └── api/              # FastAPI Backend
├── packages/
│   └── shared/           # Shared logic (Future)
└── infra/                # Docker specific configurations
```

## Milestones

- [x] **Milestone 1**: Core Loop (GPS Capture -> API -> Mock Decision)
- [x] **Milestone 2**: Admin Console + Database Persistence (PostgreSQL)
- [ ] **Milestone 3**: AI Features (Natural Language Policy, Decision Explanation)
