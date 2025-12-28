// Quick script to register a test user
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/userModel.js";

dotenv.config();

const registerTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const testUser = {
      name: "Test Lecturer",
      email: "lecturer@test.com",
      password: "password123",
      department: "Computer Science",
      role: "lecturer",
      courses: []
    };

    const user = await User.create(testUser);
    console.log("Test user created:", user.email);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

registerTestUser();