const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const mac = require("macaddress");

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ message: "Password and confirm password do not match." });
  }

  try {
    const existing_User = await prisma.users.findUnique({
      where: { email },
    });

    if (existing_User) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed_Password = await bcrypt.hash(password, salt);

    const macAddress = await mac.one();

    const user = await prisma.users.create({
      data: {
        email,
        password: hashed_Password,
        system_id: macAddress,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        system_id: user.system_id,
        join_date: user.join_date,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const checkUser = await prisma.users.findUnique({
      where: { email },
    });
    if (!checkUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, checkUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: checkUser.id }, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });

    res.status(200).json({
      user: {
        id: checkUser.id,
        email: checkUser.email,
        system_id: checkUser.system_id,
        join_date: checkUser.join_date,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
