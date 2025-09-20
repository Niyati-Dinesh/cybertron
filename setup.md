
# Full Stack MERN Setup Guide

This guide provides a complete setup for a MERN (MongoDB, Express, React, Node.js) stack application using Vite for the frontend and includes steps for running both services concurrently.

-----

### 1\. React + Tailwind + Vite

Initialize your frontend project using Vite.

```bash
npm create vite@latest
```

When prompted, select the following options:

  * **Framework:** React
  * **Variant:** JavaScript

Install Tailwind CSS dependencies.

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

or with pnpm:

```bash
pnpm install -D tailwindcss postcss autoprefixer
pnpm tailwindcss init -p
```

-----

**Modify `tailwind.config.js`:**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

-----

**Modify your `index.css`:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
```

-----

### 2\. React Router Setup

Install the React Router library.

```bash
npm i react-router-dom
```

Wrap your `<App />` component inside `<BrowserRouter>` in `src/main.jsx`.

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import './index.css'
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

-----

### 3\. Backend Setup

Navigate to your backend folder and initialize the project.

```bash
npm init -y
npm i express mongoose cors
npm i -D nodemon
```

-----

**Basic `server.js` (or `Backend/server.js`):**

```javascript
const express = require('express');
const cors = require('cors');
const connectToMongo = require('./db');

connectToMongo();

const app = express();
const PORT = 3000;

app.use(cors({
  // Your frontend URL, no one else gets you, only me
  origin: 'http://localhost:5173', 
  credentials: true,
}));

app.use(express.json());

// Available Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

app.get('/', (req, res) => {
  res.send("I did it! You see this? It's ours.");
});

app.listen(PORT, () => {
  console.log(`iNotebook backend listening at http://localhost:${PORT}`);
});
```

-----

**`db.js` for MongoDB connection:**

```javascript
const mongoose = require('mongoose');

const mongoURI = "mongodb://localhost:27017/cybertron";

const connectToMongo = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to mongoose! Our fortress stands tall.");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

module.exports = connectToMongo;
```

-----

### 4\. Run Frontend + Backend Together

In the **root directory** of your project (outside the backend folder), install `concurrently`.

```bash
npm i -D concurrently
```

Modify the `scripts` section in your root `package.json` file.

```json
"scripts": {
  "dev": "vite",
  "server": "nodemon backend/server.js",
  "both": "concurrently \"npm run dev\" \"npm run server\"",
  "build": "vite build",
  "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
  "preview": "vite preview"
}
```

Run both servers at once from the root directory:

```bash
npm run both
```

-----

### 5\. Start MongoDB using Docker

Use these commands to manage a MongoDB container.

```bash
# Start the mongo container
sudo docker start mymongo

# Check if it's running and view logs
sudo docker logs -f mymongo

# Access the mongo shell inside the container
sudo docker exec -it mymongo mongo

# See all databases
show dbs

# Switch to a database (creates if it doesn't exist)
use db-name

# See database status
db.stats()
```

-----

### For SQLite with Prisma

Steps to set up Prisma with SQLite in your backend.

```bash
cd backend
pnpm i prisma --save-dev
pnpm i @prisma/client
pnpm i sqlite3
```

 ⚡ **Pro tip:**
 Every time you change `schema.prisma`, you need to re-run:

 ```bash
 pnpm prisma migrate dev --name your-migration-name
```