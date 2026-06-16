# TravelMind

This repository is now organized into two main application folders:

- `frontend/` - the static HTML/CSS/JavaScript client
- `backend/` - the Node.js/Express API and database code

## Structure

```text
TravelMind_Fronted/
|- frontend/
|  |- *.html
|  |- css/
|  |- js/
|  |- image/
|  |- docs/
|  `- requirement/
|- backend/
|  |- src/
|  |- prisma/
|  `- scripts/
`- README.md
```

## Run The Frontend

Open `frontend/index.html` in your browser.

## Run The Backend

```sh
cd backend
npm install
npm run db:push
npm run db:generate
npm run dev
```

Create `backend/.env` first and set `DATABASE_URL` plus any required API keys.
