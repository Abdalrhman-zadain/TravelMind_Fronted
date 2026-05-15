# TravelMind Frontend

This is the frontend for the TravelMind Jordan project, a web application to help users discover, plan, and experience the best of Jordan.

---

## 👩‍💻 For Junior Developers: How to Run This Project

### Prerequisites

- Basic knowledge of HTML, CSS, and JavaScript
- [Git](https://git-scm.com/) installed on your computer
- [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) (for backend API)
- A modern web browser (Chrome, Edge, Firefox, etc.)

### Steps to Clone and Run

1. **Clone the repository from GitHub:**

   ```sh
   git clone https://github.com/your-username/your-repo-name.git
   ```

   Replace the URL above with the actual repository link.

2. **Open the project folder in VS Code or your favorite editor.**

3. **To view the frontend:**
   - Open `index.html` directly in your browser (double-click or right-click > Open with...)

4. **To run the backend (for full features):**
   - Open a terminal and navigate to the `backend` folder:
     ```sh
     cd backend
     ```
   - Install dependencies:
     ```sh
     npm install
     ```
   - Create a `.env` file in `backend/` and set `DATABASE_URL` plus any API keys you need.
   - Prepare the database and Prisma client:
     ```sh
     npm run db:push
     npm run db:generate
     ```
   - Seed sample data if you want starter content:
     ```sh
     npm run db:seed
     ```
   - Start the backend server:
     ```sh
     npm run dev
     ```
   - The backend will run on `http://localhost:3000` by default.

5. **Make changes and see them live:**
   - Edit HTML/CSS/JS files and refresh your browser to see updates.

### Common Technologies Used

- HTML5, CSS3, JavaScript (Vanilla)
- Node.js (backend)
- Express.js (backend framework)
- Prisma (database ORM)

---

## Features

- Explore attractions, hotels, and restaurants by city
- Upcoming events and cultural festivals
- Interactive photo gallery
- AI-powered chatbot for travel questions
- Smart trip planner
- Responsive and modern UI

## Project Structure

- `index.html` — Main homepage
- `css/` — All stylesheets
- `js/` — JavaScript files for interactivity
- `image/` — Images for cities, events, and gallery
- `backend/` — Backend API and data (see backend/README.md)

## Customization

- Add or update city images in `image/city/`
- Edit city cards in `index.html`
- Update styles in `css/home.css`

## License

MIT
