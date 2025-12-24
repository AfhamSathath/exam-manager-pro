import User from "../models/userModel.js";

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    res.json({ user: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Optional: GET /api/users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // exclude passwords
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
