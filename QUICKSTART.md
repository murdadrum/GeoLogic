# Quick Start Guide

## TL;DR - Get Running in 3 Steps

### 1. Start Database
```bash
cd infra && docker-compose up -d
```

### 2. Start Backend
```bash
cd apps/api
python3 -m venv venv && source venv/bin/activate
pip install fastapi "uvicorn[standard]" sqlalchemy pydantic psycopg2-binary alembic openai
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### 3. Start Frontend
```bash
cd apps/web
npm install && npm run dev
```

**Done!** Open http://localhost:3000

---

## Do I Need API Keys?

### ❌ NO - You Can Run Everything Without Keys

| Feature | Works Without Keys? | What You Get |
|---------|---------------------|--------------|
| GPS Location | ✅ Yes | Browser's native geolocation |
| Policy Editor | ✅ Yes | Full JSON editing |
| Audit Logs | ✅ Yes | Complete history |
| AI Policy Gen | ✅ Yes | Mock LLM (keyword-based) |
| Decision Explain | ✅ Yes | Template-based explanations |

### ✅ OPTIONAL - Add Keys for Enhanced Features

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| OpenAI | ❌ Paid only | Real AI policy generation |
| IPinfo | 50k/month | IP geolocation verification |
| VPNapi | 1k/day | VPN/proxy detection |

**Recommendation**: Start without keys, add later if needed.

---

## Environment Files

### Backend (`apps/api/.env`)
```bash
# Optional - system works without this
OPENAI_API_KEY=sk-your-key-here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accessgate
```

### Frontend (`apps/web/.env.local`)
```bash
# Default works fine
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Common Issues

### Port 8000 Already in Use
```bash
lsof -ti:8000 | xargs kill -9
```

### Database Connection Failed
```bash
cd infra
docker-compose down
docker-compose up -d
```

### OpenAI Warning (Safe to Ignore)
```
WARNING: OpenAI API Key not found or package missing. Using Mock LLM.
```
This is expected! The system works fine with Mock mode.

---

## What Works Right Now

✅ Location validation (GPS via browser)  
✅ Policy management (JSON editor)  
✅ AI policy generation (Mock mode)  
✅ Audit logging  
✅ Dark mode  
✅ Admin console  

## What Needs API Keys (Future)

🔑 Real AI (OpenAI)  
🔑 IP geolocation (IPinfo)  
🔑 VPN detection (VPNapi)  

---

## Next Steps

1. **Try the demo**: Follow [walkthrough.md](./walkthrough.md)
2. **Add OpenAI key**: See [SECURITY.md](./SECURITY.md)
3. **Deploy**: Add production services (IP geo, VPN detection)
