# TravelMind

TravelMind is a Jordan travel platform with a separated frontend and backend.

## Structure

```text
TravelMind_Fronted/
|- frontend/
|- backend/
`- README.md
```

## Frontend

The frontend is a static multi-page web application built with:

- `HTML`
- `CSS`
- `JavaScript`

Frontend location:

```text
frontend/
```

Open:

```text
frontend/index.html
```

## Backend

The backend is built with:

- `Node.js`
- `Express`
- `Prisma`
- `PostgreSQL`

Backend location:

```text
backend/
```

Run the backend:

```sh
cd backend
npm install
npm run db:push
npm run db:generate
npm run dev
```

Default API base:

```text
http://localhost:3000/api
```

## Notes

- Create `backend/.env` from `backend/.env.example`
- Set `DATABASE_URL` before running the backend
- Some backend scripts require additional API keys
