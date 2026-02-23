const request = require("supertest");
const app = require("../app");
require("./setup");

describe("Auth API", () => {

  it("should register a user", async () => {

    const res = await request(app)
    .post("/api/auth/register")
    .set("Content-Type", "application/json")
    .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123"
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe("test@example.com");
  });

  it("should login a user", async () => {
    await request(app).post("/api/auth/register")
    .set("Content-Type", "application/json")
    .send({
      name: "Test User",
      email: "login@example.com",
      password: "password123"
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@example.com",
        password: "password123"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Login successful");
  });

});