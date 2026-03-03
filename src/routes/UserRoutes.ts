import { Router } from "express";
import UserController from "../controllers/UserController";

const router = Router();

// Quando o Front-end fizer um POST para esta rota, chamamos o Controller
router.post("/", UserController.create);

export default router;
