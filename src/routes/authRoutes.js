import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { resHelper } from "../helpers/errorHandler.js";
import { pool } from "../db.js";

const router = express.Router();

router.post(`/register`, async (req, res, next) => {
  const { username, password } = req.body;
  const client = await pool.connect();

  try {
    await client.query(`BEGIN`);

    const userExists = await client.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (userExists.rows[0]) {
      await client.query(`ROLLBACK`);
      return resHelper(res, 400, "Username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultTodo = `Hello! Start adding todos!`;

    const newUser = await client.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, hashedPassword]
    );
    const userId = newUser.rows[0].id;

    await client.query("INSERT INTO todos (user_id, task) VALUES ($1, $2)", [
      userId,
      defaultTodo,
    ]);

    await client.query(`COMMIT`);
    resHelper(res, 201, "User registered");
  } catch (err) {
    await client.query(`ROLLBACK`);
    next(err);
  } finally {
    client.release();
  }
});

router.post(`/login`, async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (!user.rows[0]) {
      return resHelper(res, 400, "Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );
    if (!isValidPassword) {
      return resHelper(res, 400, "Invalid credentials");
    }

    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    resHelper(res, 200, "Login successful", { token });
  } catch (err) {
    next(err);
  }
});

router.post(`/logout`, (req, res) => {
  resHelper(res, 200, "Successfully logged out");
});

export default router;
