import userModels from "../models/user.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";


const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.SECRET_KEY,
    { expiresIn: "1d" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.SECRET_KEY,
    { expiresIn: "7d" }
  );
};

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER || "kyle.glover85@ethereal.email", 
    pass: process.env.EMAIL_PASS || "AFwsrJmbW9M1uGQCxZ", 
  },
});


export const createUser = async (req, res) => {
  const { name, email, password, isAdmin } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await userModels.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await userModels.create({
      name,
      email,
      password: hashPassword,
      isAdmin,
    });

    const info = await transporter.sendMail({
      from: '"Kyle Glover 👻" <kyle.glover85@ethereal.email>', 
      to: email, // send to the user's email
      subject: "Welcome to the platform!",
      text: `Hi ${name}, welcome to our platform!`, 
      html: `<b>Hi ${name},</b><p>Welcome to our platform!</p>`, // HTML body
    });

    console.log("Message sent: %s", info.messageId);

    res.status(201).json({
      emailSent: true,
      emailId: info.messageId,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logInUser = async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Find the user
    const user = await userModels.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({ message: "Login successful", user, accessToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Refresh token function
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = jwt.verify(refreshToken, process.env.SECRET_KEY);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Token refreshed successfully", accessToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout function
export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "strict",
    });
    res.json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    const users = await userModels.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
