import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Router } from "express";

import { initializeAdminController } from "./admin/AdminController";
import { initializeUserController } from "./auth/UserController";
import { servicesMiddleware } from "./middleware/ServicesMiddleware";
import { initializePagesController } from "./pages/PagesController";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://calendar.xyzdigital.local", process.env.ORIGIN],
    default: process.env.ORIGIN,
  })
);

const apiRouter = Router();

apiRouter.use(express.json());
apiRouter.use(cookieParser());
apiRouter.use(servicesMiddleware);

initializeAdminController(apiRouter);
initializeUserController(apiRouter);
initializePagesController(apiRouter);

app.use("/api", apiRouter);

app.listen(3939);
