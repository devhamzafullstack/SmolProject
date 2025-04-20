export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? "Internal server error" : err.message;

  if (process.env.NODE_ENV !== "production") console.error(err.stack);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

import jwt from "jsonwebtoken";
import { resHelper } from "../helpers/errorHandler.js";
import dotenv from "dotenv";

dotenv.config();

export function getUserID(req, res, next) {
  const token = req.headers[`authorization`];
  if (!token) {
    return resHelper(res, 401, "No token provided"); 
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return resHelper(res, 401, "Invalid token"); 
    }
    req.userId = decoded.id;
    next();
  });
}
