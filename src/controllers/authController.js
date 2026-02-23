const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const generateAccessToken = require("../utils/generateAccessToken");
const generateRefreshToken = require("../utils/generateRefreshToken");

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1️⃣ Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2️⃣ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
       return res.status(400).json({
        message: "Email already registered",
      });
    }

    // 3️⃣ Create user (password hashed via pre-save middleware)
    const user = await User.create({
      name,
      email,
      password,
    });

    // 4️⃣ Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 5️⃣ Hash and store refresh token in DB
    await User.findByIdAndUpdate(user._id, {
      refreshToken: await bcrypt.hash(refreshToken, 10),
    });

    // 6️⃣ Send tokens via HttpOnly cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    // next(err); // handled by errorMiddleware
    console.error("ACTUAL ERROR:", err);
  res.status(500).json({
    message: err.message,
  });
  }
};
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find user and explicitly select password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // 3️⃣ Compare password using model method
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // 4️⃣ Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 5️⃣ Hash and store refresh token
    await User.findByIdAndUpdate(user._id, {
        refreshToken: await bcrypt.hash(refreshToken, 10),
      });

    // 6️⃣ Clear old cookies (optional but clean)
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // 7️⃣ Set new cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
  console.error("Login Error:", err);
  res.status(500).json({
    message: "Internal Server Error",
  });
}
};
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || !user.refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const isValid = await bcrypt.compare(token, user.refreshToken);

    if (!isValid) {
      return res.status(403).json({ message: "Refresh token reuse detected" });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, {
      refreshToken: await bcrypt.hash(refreshToken, 10),
    });

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Token refreshed" });

  } catch (err) {
    // next(err);
    console.error("Refresh Error:", err);

    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.logout = async (req, res, next) => {
  try {
    // 1️⃣ Remove refresh token from DB
    req.user.refreshToken = null;
    await req.user.save();

    // 2️⃣ Clear cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    res.status(200).json({
      message: "Logged out successfully",
    });

  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};