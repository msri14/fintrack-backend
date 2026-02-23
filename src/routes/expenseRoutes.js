const express = require("express");
const router = express.Router();
const { createExpenseValidation } = require("../validations/expenseValidation");
const { validateRequest } = require("../middleware/validateRequest");



const {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getMonthlySummary,
  getCategoryBreakdown,
  getRangeTotal,
  getYearlySummary,
  getAverageDailyExpense,
  getTopCategory
} = require("../controllers/expenseController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect); // All routes protected

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create new expense
 *     tags: [Expenses]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - category
 *             properties:
 *               amount:
 *                 type: number
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Expense created
 */
router.post(
  "/",
  createExpenseValidation,
  validateRequest,
  createExpense
);
/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get paginated list of expenses
 *     tags: [Expenses]
 *     security:
 *       - cookieAuth: []
 *     description: Returns paginated expenses for the authenticated user with optional category filtering.
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number (default is 1)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of records per page (default is 10)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *       - in: query
 *         name: category
 *         required: false
 *         description: Filter expenses by category
 *         schema:
 *           type: string
 *           example: Food
 *     responses:
 *       200:
 *         description: Paginated expenses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 47
 *                 page:
 *                   type: integer
 *                   example: 2
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 hasNextPage:
 *                   type: boolean
 *                   example: true
 *                 hasPrevPage:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       category:
 *                         type: string
 *                       description:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", getExpenses);
/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Update an existing expense
 *     tags: [Expenses]
 *     security:
 *       - cookieAuth: []
 *     description: Updates an expense belonging to the authenticated user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Expense ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 category:
 *                   type: string
 *                 description:
 *                   type: string
 *                 date:
 *                   type: string
 *                   format: date
 *       404:
 *         description: Expense not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put("/:id", updateExpense);
/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Delete expense
 *     tags: [Expenses]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense deleted
 */
router.delete("/:id", deleteExpense);
/**
 * @swagger
 * /api/expenses/summary:
 *   get:
 *     summary: Get monthly expense summary
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     description: Returns total expense amount and number of transactions for a given month and year.
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         description: Month number (1-12)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: year
 *         required: true
 *         description: Year (e.g., 2025)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Monthly summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                   example: 4500
 *                 count:
 *                   type: number
 *                   example: 12
 *       400:
 *         description: Month and year are required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/summary", getMonthlySummary);
/**
 * @swagger
 * /api/expenses/category-breakdown:
 *   get:
 *     summary: Get expense totals grouped by category for a given month
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     description: Returns total expense amount per category for the specified month and year.
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         description: Month number (1-12)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: year
 *         required: true
 *         description: Year (e.g., 2025)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category breakdown retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                     example: Food
 *                   total:
 *                     type: number
 *                     example: 1500
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/category-breakdown", getCategoryBreakdown);
/**
 * @swagger
 * /api/expenses/range-total:
 *   get:
 *     summary: Get total expenses within a date range
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     description: Returns total expense amount between the provided start and end dates.
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         description: Start date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *           example: 2025-02-01
 *       - in: query
 *         name: end
 *         required: true
 *         description: End date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *           example: 2025-02-28
 *     responses:
 *       200:
 *         description: Total expense within date range
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                   example: 5200
 *       400:
 *         description: Start and end date required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/range-total", getRangeTotal);
/**
 * @swagger
 * /api/expenses/yearly-summary:
 *   get:
 *     summary: Get yearly expense summary grouped by month
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Returns total expense per month for a given year.
 *       Results may be cached for performance optimization.
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         description: Year for summary (e.g., 2025)
 *         schema:
 *           type: integer
 *           example: 2025
 *     responses:
 *       200:
 *         description: Yearly summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: integer
 *                     description: Month number (1 = January, 12 = December)
 *                     example: 1
 *                   total:
 *                     type: number
 *                     example: 4500
 *       400:
 *         description: Year required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/yearly-summary", getYearlySummary);
/**
 * @swagger
 * /api/expenses/average-daily:
 *   get:
 *     summary: Get total and average daily expense for a month
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Returns the total expense and average daily expense 
 *       for the specified month and year.
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         description: Month number (1-12)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 2
 *       - in: query
 *         name: year
 *         required: true
 *         description: Year (e.g., 2025)
 *         schema:
 *           type: integer
 *           example: 2025
 *     responses:
 *       200:
 *         description: Average daily expense calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                   example: 3000
 *                 averageDaily:
 *                   type: number
 *                   example: 96.77
 *       400:
 *         description: Month and year are required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/average-daily", getAverageDailyExpense);
/**
 * @swagger
 * /api/expenses/top-category:
 *   get:
 *     summary: Get most frequently used expense category for a month
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *     description: |
 *       Returns the category with the highest number of expenses 
 *       for the specified month and year.
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         description: Month number (1-12)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 2
 *       - in: query
 *         name: year
 *         required: true
 *         description: Year (e.g., 2025)
 *         schema:
 *           type: integer
 *           example: 2025
 *     responses:
 *       200:
 *         description: Top category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   type: string
 *                   nullable: true
 *                   example: Food
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/top-category", getTopCategory);

module.exports = router;