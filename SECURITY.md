# Security & API Configuration Guide

## Environment Variables Setup

### Backend (FastAPI)
1. Copy the example file:
   ```bash
   cd apps/api
   cp .env.example .env
   ```

2. Edit `.env` and add your keys:
   ```bash
   OPENAI_API_KEY=sk-your-actual-key-here
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accessgate
   ```

### Frontend (Next.js)
1. Copy the example file:
   ```bash
   cd apps/web
   cp .env.example .env.local
   ```

2. The default values should work for local development.

---

## API Keys & Services

### 1. **OpenAI API (Optional)**
- **Purpose**: Powers the AI policy generation and decision explanations
- **Fallback**: System uses a Mock LLM if no key is provided
- **Get Key**: https://platform.openai.com/api-keys
- **Cost**: Pay-per-use (~$0.002 per request for GPT-3.5)
- **Recommendation**: Start with Mock mode, add real API later if needed

### 2. **GPS/Geolocation (Built-in Browser API)**
- **No API Key Needed!** ✅
- The browser's native `navigator.geolocation` API is used
- Works on HTTPS or localhost
- User must grant permission
- **Accuracy**: 
  - Mobile: 5-50 meters (with GPS)
  - Desktop: 20-1000 meters (WiFi/IP-based)

### 3. **Google Maps API (NOT Required)**
- **You DON'T need this** for basic location validation
- Only needed if you want:
  - Reverse geocoding (lat/lon → address)
  - Map visualization in the UI
  - Places autocomplete
- **Alternative**: Use free services like Nominatim (OpenStreetMap)

### 4. **IP Geolocation Services (Future Enhancement)**
For production, you might want to add IP-based location verification:

#### Option A: IPinfo (Recommended)
- **Free Tier**: 50,000 requests/month
- **Signup**: https://ipinfo.io/signup
- **Features**: Country, region, city, ASN, VPN detection
- **Cost**: Free tier is generous

#### Option B: MaxMind GeoIP2
- **Free Tier**: GeoLite2 database (self-hosted)
- **Signup**: https://www.maxmind.com/en/geolite2/signup
- **Features**: Country, city, ASN
- **Cost**: Free (database updates weekly)

### 5. **VPN Detection (Future Enhancement)**
If you need to detect VPNs/proxies:

#### Option A: IPHub
- **Free Tier**: 1,000 requests/day
- **Signup**: https://iphub.info/
- **Features**: VPN/proxy detection score

#### Option B: VPNapi.io
- **Free Tier**: 1,000 requests/day
- **Signup**: https://vpnapi.io/
- **Features**: VPN, Tor, proxy detection

---

## Current Implementation Status

### ✅ Working Without API Keys
- GPS location capture (browser API)
- Mock AI policy generation
- Mock decision explanations
- Database persistence
- Admin console

### 🔧 Requires API Keys (Optional)
- Real OpenAI-powered policy generation
- IP-based geolocation verification
- VPN/proxy detection

---

## Recommended Setup for Development

1. **Start Simple** (No API keys needed):
   ```bash
   # Just use the Mock LLM
   # GPS works via browser
   # Everything else is local
   ```

2. **Add OpenAI** (When you want real AI):
   ```bash
   export OPENAI_API_KEY=sk-...
   ```

3. **Production Enhancements** (Later):
   - Add IP geolocation service
   - Add VPN detection
   - Consider rate limiting
   - Add authentication/authorization

---

## Security Best Practices

### ✅ Already Implemented
- `.env` files in `.gitignore`
- Environment variable separation (backend/frontend)
- Example files (`.env.example`) for documentation

### 🔒 Recommended for Production
1. **Use a secrets manager**:
   - AWS Secrets Manager
   - Google Cloud Secret Manager
   - HashiCorp Vault
   - Doppler

2. **Rotate API keys** regularly

3. **Use different keys** for dev/staging/prod

4. **Add rate limiting** to prevent API abuse

5. **Implement authentication** for admin endpoints

---

## Cost Estimate (Monthly)

| Service | Free Tier | Paid (if exceeded) |
|---------|-----------|-------------------|
| Browser GPS | ✅ Free | N/A |
| Mock LLM | ✅ Free | N/A |
| OpenAI (GPT-3.5) | ❌ None | ~$5-20/month (low usage) |
| IPinfo | ✅ 50k req | $99/month (250k req) |
| MaxMind GeoLite2 | ✅ Free | $0 (self-hosted) |
| VPNapi.io | ✅ 1k/day | $10/month (10k/day) |

**Total for MVP**: $0 (using free tiers + mock services)
