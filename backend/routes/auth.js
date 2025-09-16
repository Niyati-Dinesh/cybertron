const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const authController = require("../controllers/authControllers");
const { protect } = require("../middleware/authMiddleware");

router.post(
  "/register",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
    check("confirmPassword", "Confirm password is required").exists(),
  ],
  authController.register
);

router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  authController.login
);

router.get("/private", protect, (req, res) => {
  res.json({ message: "Access granted", userId: req.userId });
});
module.exports = router;