const Expense = require("../models/Expense");
const { getCache, setCache } = require("../utils/cache");

exports.createExpense = async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;

    if (!amount || !category) {
      return res.status(400).json({
        message: "Amount and category are required",
      });
    }

    const expense = await Expense.create({
      userId: req.user._id,
      amount,
      category,
      description,
      date,
    });

    res.status(201).json(expense);

  } catch (err) {
    // console.error("Create Expense Error:", err);
    // res.status(500).json({ message: "Internal Server Error" });

  console.error("CREATE EXPENSE ERROR:", err);
  res.status(500).json({ message: err.message });

  }
};

exports.getExpenses = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const { category } = req.query;

    const filter = { userId: req.user._id };

    if (category) {
      filter.category = category;
    }

    const total = await Expense.countDocuments(filter);

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
      data: expenses,
    });

  } catch (err) {
    console.error("Get Expenses Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    Object.assign(expense, req.body);
    await expense.save();

    res.json(expense);

  } catch (err) {
    console.error("Update Expense Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });

  } catch (err) {
    console.error("Delete Expense Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: "Month and year are required",
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const result = await Expense.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(result[0] || { total: 0, count: 0 });

  } catch (err) {
    console.error("Monthly Summary Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getCategoryBreakdown = async (req, res) => {
  try {
    const { month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const result = await Expense.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          total: 1,
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    res.json(result);

  } catch (err) {
    console.error("Category Breakdown Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getRangeTotal = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Start and end date required",
      });
    }

    const result = await Expense.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: {
            $gte: new Date(start),
            $lte: new Date(end),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    res.json(result[0] || { total: 0 });

  } catch (err) {
    console.error("Range Total Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getYearlySummary = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ message: "Year required" });
    }

    const cacheKey = `yearly-${req.user._id}-${year}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(Number(year) + 1, 0, 1);

    const result = await Expense.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          total: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id": 1 },
      },
    ]);
    setCache(cacheKey, result);
    res.json(result);

  } catch (err) {
    console.error("Yearly Summary Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getAverageDailyExpense = async (req, res) => {
  try {
    const { month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const result = await Expense.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const total = result[0]?.total || 0;
    const daysInMonth = new Date(year, month, 0).getDate();

    res.json({
      total,
      averageDaily: total / daysInMonth,
    });

  } catch (err) {
    console.error("Average Daily Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getTopCategory = async (req, res) => {
  try {
    const { month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const result = await Expense.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    res.json(result[0] || { category: null, count: 0 });

  } catch (err) {
    console.error("Top Category Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};