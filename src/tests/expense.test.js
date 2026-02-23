const request = require("supertest");
const app = require("../app");
require("./setup");

describe("Expense API", () => {

  it("should create expense for authenticated user", async () => {

    const agent = request.agent(app);

    // Register user (agent stores cookies automatically)
    await agent
      .post("/api/auth/register")
      .send({
        name: "User",
        email: "expense@test.com",
        password: "password123"
      });

    // Create expense (cookies automatically sent)
    const res = await agent
      .post("/api/expenses")
      .send({
        amount: 500,
        category: "Food"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.amount).toBe(500);
  });

});