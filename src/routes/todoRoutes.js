import express from "express";
import { resHelper } from "../helpers/errorHandler.js";
import { getUserID } from "../middleware/authMiddleware.js";
import prisma from "../prismaClient.js";

const router = express.Router();

router.get(`/`, async (req, res, next) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.userId },
      select: { id: true, task: true, completed: true },
    });
    resHelper(res, 200, "Got todos", { todos });
  } catch (error) {
    next(error);
  }
});

router.post(`/`, getUserID, async (req, res, next) => {
  try {
    const { task } = req.body;
    const newTodo = await prisma.todo.create({
      data: {
        task,
        user: { connect: { id: req.userId } },
      },
      select: { id: true, task: true, completed: true },
    });
    resHelper(res, 201, "Todo created", newTodo);
  } catch (error) {
    next(error);
  }
});

router.put(`/:id`, getUserID, async (req, res, next) => {
  try {
    const updatedTodo = await prisma.todo.update({
      where: {
        id: parseInt(req.params.id),
        userId: req.userId,
      },
      data: {
        task: req.body.task,
        completed: req.body.completed,
      },
      select: { id: true, task: true, completed: true },
    });
    resHelper(res, 200, "Todo updated", updatedTodo);
  } catch (error) {
    if (error.code === "P2025") {
      return resHelper(res, 404, "Todo not found");
    }
    next(error);
  }
});

router.delete(`/:id`, getUserID, async (req, res, next) => {
  try {
    await prisma.todo.delete({
      where: {
        id: parseInt(req.params.id),
        userId: req.userId,
      },
    });
    resHelper(res, 200, "Todo deleted");
  } catch (error) {
    if (error.code === "P2025") {
      return resHelper(res, 404, "Todo not found");
    }
    next(error);
  }
});

export default router;
