// backend/controllers/authController.js
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

// ===== Generate JWT Token =====
const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ===== Register User =====
export const register = async (req, res) => {
  try {
    const { name, email, password, department, role, courses } = req.body;

    // Check required fields
    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // For examiner, courses are required
    if (role === 'examiner' && (!courses || courses.length === 0)) {
      return res.status(400).json({ message: "Courses are required for examiner" });
    }

    // Check if user already exists
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    // Create new user
    const user = await User.create({ name, email, password, department, role, courses: courses || [] });

    // Return token and user info
    res.status(201).json({
      token: genToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        courses: user.courses,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===== Login User =====
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Return token and user info
    res.json({
      token: genToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===== Get Current User =====
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
