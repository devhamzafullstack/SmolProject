import express from "express";
import dotenv from "dotenv";
import { errorHandler, getUserID } from "./middleware/authMiddleware.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { initializeTables } from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, `../public`)));

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get(`/`, (req, res) => {
  res.sendFile(path.join(__dirname, `../public/index.html`));
});

app.use(`/auth`, authRoutes);
app.use(`/todos`, getUserID, todoRoutes);
app.use(errorHandler);

const startServer = async () => {
  try {
    await initializeTables();
    app.listen(PORT, () => {
      console.log(`APP started on PORT ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
