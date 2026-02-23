const jwt = require("jsonwebtoken");

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" } // long-lived
  );
};

module.exports = generateRefreshToken;