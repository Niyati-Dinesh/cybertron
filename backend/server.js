require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const port = 5000;


app.use(express.json()); 
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true,
}));
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});

