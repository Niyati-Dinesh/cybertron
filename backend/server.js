const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Allows the app to parse JSON from the body
app.use(cors({
  origin: "http://localhost:5173", // Replace with your frontend URL
  credentials: true,
}));

// Route for authentication
const authRoutes = require('./routes/auth');
app.use('/api/routes/auth', authRoutes);

// Base route to test DB connection (as in your screenshot)
app.get('/', async (req, res) => {
  res.send('Backend is running and connected!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend listening at http://localhost:${PORT}`);
});