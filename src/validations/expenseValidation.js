const { body, query } = require("express-validator");

exports.createExpenseValidation = [
  body("amount")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a positive number"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Description too long"),
];

exports.summaryValidation = [
  query("month")
    .isInt({ min: 1, max: 12 })
    .withMessage("Valid month required"),

  query("year")
    .isInt({ min: 2000 })
    .withMessage("Valid year required"),
];