# GeoLogic (AccessGate AI)

**Policy-driven location attestation (IP vs GPS) + VPN/proxy detection + explainable decisions + audit + monitoring**

This project ("AccessGate AI") is a modern location attestation system that goes beyond simple IP vs GPS matching. It implements a risk-scoring and policy engine to validate user locations for protected resources, detecting VPNs, proxies, and spoofing attempts.

## Architecture

- **Frontend**: Next.js (TypeScript), Tailwind, ShadCN UI, Dark Mode
- **Backend**: FastAPI (Python), Pydantic, SQLAlchemy
- **Database**: PostgreSQL (via Docker)
- **AI**: OpenAI GPT (with Mock fallback)
- **Infrastructure**: Docker Compose

## Features

- **Location Validation**: Compares browser GPS with IP-based geolocation.
- **AI Policy Generation**: Natural language to JSON policy conversion.
- **Risk Analysis**: Detects VPNs, proxies, and Tor usage (Mocked for MVP).
- **Policy Engine**: Admin-configurable rules for ALLOW/STEP_UP/DENY decisions.
- **Audit Trails**: Detailed logs of all attestations and decisions.
- **Admin Console**: Interface to manage policies and view audit logs.
- **Dark Mode**: Full light/dark theme support across all pages.

## Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.11+)
- (Optional) OpenAI API Key

## Getting Started

### 1. Environment Setup

**Backend**:
```bash
cd apps/api
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY (optional - uses Mock LLM if not provided)
```

**Frontend**:
```bash
cd apps/web
cp .env.example .env.local
# Default values work for local development
```

📖 **See [SECURITY.md](./SECURITY.md) for detailed API key information and security best practices.**

### 2. Start Infrastructure (Database)

```bash
cd infra
docker-compose up -d
```

### 3. Setup Backend (API)

```bash
cd apps/api
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi "uvicorn[standard]" sqlalchemy pydantic psycopg2-binary alembic openai

# Run database migrations
alembic upgrade head

# Start API server
uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 4. Setup Frontend (Web)

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
2.  **AI Policy Generation**: Go to `http://localhost:3000/admin/policies` and type a natural language prompt like "Allow US and Canada, block VPNs" to generate a policy.
3.  **Admin Console**: Navigate to `http://localhost:3000/admin` to view the Dashboard.
    -   **Policies**: View and edit the JSON policy that drives decisions.
    -   **Audit Logs**: View a history of all attestation requests, including decisions and risk scores.

## Project Structure

```
GeoLogic/
├── apps/
│   ├── web/              # Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/      # App Router pages
│   │   │   └── components/
│   └── api/              # FastAPI Backend
│       ├── api/v1/       # API routes
│       ├── services/     # Business logic (LLM, etc.)
│       └── models_db.py  # Database models
├── packages/
│   └── shared/           # Shared logic (Future)
├── infra/                # Docker configurations
├── SECURITY.md           # API keys & security guide
└── walkthrough.md        # Demo guide
```

## Milestones

- [x] **Milestone 1**: Core Loop (GPS Capture -> API -> Mock Decision)
- [x] **Milestone 2**: Admin Console + Database Persistence (PostgreSQL)
- [x] **Milestone 3**: AI Features (Natural Language Policy, Decision Explanation)
- [ ] **Milestone 4**: Production Enhancements (IP Geolocation, VPN Detection, Auth)

## API Keys & Services

### Required (None!)
- ✅ **GPS**: Uses browser's built-in `navigator.geolocation` API (no key needed)
- ✅ **Mock LLM**: Built-in fallback for AI features (no key needed)

### Optional
- 🔑 **OpenAI**: For real AI policy generation ($5-20/month for low usage)
- 🔑 **IPinfo**: For IP-based geolocation in production (50k free/month)
- 🔑 **VPNapi**: For VPN detection (1k free/day)

See [SECURITY.md](./SECURITY.md) for detailed setup instructions.

## License

MIT
