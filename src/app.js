const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
// const mongoSanitize = require("express-mongo-sanitize");
// const xss = require("xss-clean");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const app = express();

// Trust proxy (important for rate limiting behind proxies)
// app.set("trust proxy", 1);

// Security headers
// app.use(helmet());

// app.use(cors({
//   origin: "http://localhost:5001",
//   credentials: true
// }));
app.use(cors({
  origin: true,
  credentials: true,
}));
// Body parser with size limit
app.use(express.json({ limit: "10kb" }));

// Parse cookies
app.use(cookieParser());

// 🛡 Prevent NoSQL injection
// app.use(mongoSanitize());

// 🛡 Prevent XSS
// app.use(xss());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));



// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

module.exports = app;