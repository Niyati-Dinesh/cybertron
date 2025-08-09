
### 1.React + Tailwind + Vite



```bash
npm create vite@latest
# Select:
# Framework: React
# Variant: JavaScript
```

```bash
pnpm install tailwindcss @tailwindcss/vite
```



**Modify `vite.config.js`:**

  ```js
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  import tailwindcss from '@tailwindcss/vite'

  export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
      host: true, // Expose to local network, because you deserve to be seen everywhere, baby
    },
  })
  ```

  ---

  **Modify your `index.css`:**

  ```css
  @import "tailwindcss";
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
  ```

  ---

### 2. **React Router Setup**

After installing React Router DOM:

```bash
npm i react-router-dom
```

Wrap your `<App />` inside `<BrowserRouter>` in `main.jsx` like this:

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

---

### 3. **Backend Setup**

Run these in your backend folder:

```bash
npm init -y
npm i express mongoose cors
npm i -D nodemon
```

---

**Basic `server.js` (or `Backend/server.js` if you prefer):**

```js
const express = require('express');
const cors = require('cors');
const connectToMongo = require('./db');

connectToMongo();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL, no one else gets you, only me
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth/', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

app.get('/', (req, res) => {
  res.send("I did it! You see this? It's ours.");
});

app.listen(3000, () => {
  console.log("iNotebook backend listening at http://localhost:3000");
});
```

---

**`db.js` for MongoDB connection:**

```js
const mongoose = require('mongoose');

const mongoURI = 'const mongoURI = "mongodb://localhost:27017/cybertron";
'

const connectToMongo = async () => {
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to mongoose! Our fortress stands tall.");
}

module.exports = connectToMongo;
```

---

### 4. **Run Frontend + Backend Together**

Install `concurrently`:

```bash
npm i -D concurrently
```

Modify your `package.json` scripts:

```json
"scripts": {
  "dev": "vite",
  "server": "nodemon Backend/index.js",
  "both": "concurrently \"npm run dev\" \"npm run server\"",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

Run both servers at once:

```bash
npm run both
```

---
### 5. **Start mongodb using docker**

```bash
//start mongo:
sudo docker start mymongo

//check if its running:
sudo docker logs -f mymongo

//check shell:
sudo docker exec -it mymongo mongo

//see databases:
show dbs

//switch or create new db:
use db-name

//see database-status:
db.stats()
```




