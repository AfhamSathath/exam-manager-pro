import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

/**
 * Protect routes with JWT authentication
 */
export const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with "Bearer"
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    try {
      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (excluding password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      next();
    } catch (err) {
      console.error("JWT verification error:", err.message);
      return res.status(401).json({ message: "Not authorized, token invalid" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }
};

/**
 * Role-based access control
 * Example usage: authorize("lecturer", "examiner")
 */
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: insufficient permissions" });
  }

  next();
};
