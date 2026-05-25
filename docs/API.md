# AI ResumeIQ API Documentation

Base URL: `http://localhost:8000` (development)

## Authentication

All protected routes require header:
```
Authorization: Bearer <jwt_token>
```

### POST /api/auth/register
```json
{ "email": "user@example.com", "password": "secret123", "name": "Jane" }
```

### POST /api/auth/login
```json
{ "email": "user@example.com", "password": "secret123" }
```

### POST /api/auth/google
```json
{ "googleId": "...", "email": "...", "name": "...", "avatar": "..." }
```

### GET /api/auth/me
Returns current user profile.

---

## Resumes

### POST /api/resumes
`multipart/form-data` — field `resume` (PDF or DOCX)

### GET /api/resumes
List user resumes.

### GET /api/resumes/dashboard
Analytics: ATS score, skills, application stats.

### GET /api/resumes/:id
### DELETE /api/resumes/:id

---

## Jobs & AI

### POST /api/jobs/match
```json
{ "resumeText": "...", "jobDescription": "...", "resumeId": "optional" }
```

### POST /api/jobs/cover-letter
```json
{ "resumeText": "...", "jobDescription": "...", "companyName": "...", "tone": "professional" }
```

### POST /api/jobs/improve-bullet
```json
{ "bullet": "Worked on web dev", "context": "Software Engineer" }
```

### POST /api/jobs/chat
```json
{ "messages": [{ "role": "user", "content": "..." }], "resumeText": "optional" }
```

---

## Applications

### GET /api/applications
### POST /api/applications
```json
{ "companyName": "Acme", "jobTitle": "Engineer", "status": "APPLIED" }
```

### PATCH /api/applications/:id
```json
{ "status": "INTERVIEW", "notes": "...", "feedback": "..." }
```

### DELETE /api/applications/:id

---

## Admin (ADMIN role)

### GET /api/admin/stats
### GET /api/admin/users
### PATCH /api/admin/users/:id/role
```json
{ "role": "ADMIN" }
```

---

## Health

### GET /api/health
