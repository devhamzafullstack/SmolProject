import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { resHelper } from "../helpers/errorHandler.js";
import prisma from "../prismaClient.js";

const router = express.Router();

router.post(`/register`, async (req, res, next) => {
  const { username, password } = req.body;
  const defaultTodo = `Hello! Start adding todos!`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        throw new Error("Username already exists");
      }

      const newUser = await tx.user.create({
        data: {
          username,
          password: await bcrypt.hash(password, 10),
          todos: {
            create: {
              task: defaultTodo,
            },
          },
        },
        include: {
          todos: true,
        },
      });

      return newUser;
    });

    resHelper(res, 201, "User registered", {
      userId: result.id,
      todoCount: result.todos.length,
    });
  } catch (err) {
    if (err.message === "Username already exists") {
      return resHelper(res, 400, err.message);
    }
    next(err);
  }
});

router.post(`/login`, async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return resHelper(res, 400, "Invalid credentials");
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    resHelper(res, 200, "Login successful", {
      token,
      username: user.username,
    });
  } catch (err) {
    next(err);
  }
});

router.post(`/logout`, (req, res) => {
  resHelper(res, 200, "Successfully logged out");
});

export default router;
