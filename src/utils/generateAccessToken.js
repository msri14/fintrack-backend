// utils/generateToken.js

const jwt = require("jsonwebtoken");

const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {expiresIn: "15m"}
  );
};

module.exports = generateAccessToken;