import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { initializeTables, pool } from "../db.js";
import { resHelper } from "../helpers/errorHandler.js";
import { getUserID } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(`/`, async (req, res, next) => {
  try {
    const user_id = req.userId;
    const getTodos = await pool.query(
      `SELECT * FROM todos WHERE user_id = $1`,
      [user_id]
    );
    resHelper(res, 200, "Got todos", { todos: getTodos.rows });
  } catch (error) {
    next(error);
  }
});

router.post(`/`, getUserID, async (req, res, next) => {
  try {
    const { task } = req.body;
    const newTodo = await pool.query(
      `INSERT INTO todos (user_id, task) VALUES ($1, $2) RETURNING *`,
      [req.userId, task]
    );
    resHelper(res, 201, "Todo created", {
      id: newTodo.rows[0].id,
      task,
      completed: false,
    });
  } catch (error) {
    next(error);
  }
});

router.put(`/:id`, getUserID, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { task, completed } = req.body;

    const updatedTodo = await pool.query(
      `UPDATE todos SET task = $1, completed = $2 
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [task, completed, id, req.userId]
    );

    if (!updatedTodo.rows[0]) {
      return resHelper(res, 404, "Todo not found");
    }

    resHelper(res, 200, "Todo updated", updatedTodo.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete(`/:id`, getUserID, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.userId]
    );

    if (!result.rows[0]) {
      return resHelper(res, 404, "Todo not found");
    }

    resHelper(res, 200, "Todo deleted");
  } catch (error) {
    next(error);
  }
});

export default router;
