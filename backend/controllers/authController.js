const { PrismaClient } = require('../generated/prisma');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const macaddress = require("macaddress");
const prisma = new PrismaClient();
const dbModel = prisma.users;

//---------------------REGISTER-----------------------
exports.register = async (req, res) => {
  const { email, password } = req.body;
  let system_id;

  try {
    // Get the MAC address of the host machine
    system_id = await macaddress.one();

    // Hashing the password
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const newUser = await dbModel.create({
      data: {
        email,
        password: hashedPassword,
        system_id,
      },
    });
    // Use the `id` for the token
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });
    console.log("Registered");
    res.status(200).json({ user: newUser, token });
  } 
  catch (error) {
    console.log("Registration failed");
    console.error(error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

//---------------------LOGIN-----------------------
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Use prisma.users.findUnique() to match your "Users" table
    const user = await dbModel.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Email not registered" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Use the `id` for the token since your schema doesn't have `uid`
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });
    console.log("Logged in");
    res.status(200).json({ user, token });
  } 
  catch (error) {
    console.log("Login failed");
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};