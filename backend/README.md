# Backend (Resume Upload + PDF Parse)

## Install

```bash
cd backend
npm install
```

## Run

```bash
npm start
```

Server runs on `http://localhost:5000`.

## Endpoint

- `POST /upload`
- Form-data field: `resume` (single file, PDF only)

## Test with cURL

```bash
curl -X POST http://localhost:5000/upload \
  -F "resume=@C:/path/to/resume.pdf"
```

Expected response:

```json
{
  "success": true,
  "text": "extracted resume text"
}
```
