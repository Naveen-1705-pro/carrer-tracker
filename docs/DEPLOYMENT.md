# Deployment Guide — AI ResumeIQ

## Architecture

```
[Vercel] Next.js Frontend  →  [Render/Railway] Express API  →  [PostgreSQL]
                                      ↓
                              Gemini / OpenAI APIs
```

## Docker (full stack)

```bash
docker compose up -d
```

Services: PostgreSQL (5432), API (8000), Frontend (3000)

## Vercel (Frontend)

1. Import `frontend/` directory
2. Set environment variable:
   - `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`
3. Deploy

## Render / Railway (Backend)

1. Connect `backend/` repository
2. Build command: `npm install && npx prisma generate && npm run build`
3. Start command: `npx prisma db push && npm start`
4. Environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `GEMINI_API_KEY` or `OPENAI_API_KEY`
   - `FRONTEND_URL=https://your-app.vercel.app`

## Database

Use managed PostgreSQL (Supabase, Neon, RDS). Run migrations:

```bash
cd backend
npx prisma db push
npx ts-node prisma/seed.ts
```

## Security checklist

- [ ] Rotate `JWT_SECRET` in production
- [ ] Enable HTTPS only
- [ ] Restrict CORS `FRONTEND_URL`
- [ ] Never commit `.env` files
- [ ] Use secrets manager for API keys
