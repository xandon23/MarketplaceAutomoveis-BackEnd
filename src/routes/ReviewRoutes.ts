import { Router } from "express";
import ReviewController from "../controllers/ReviewController";
import { authMiddleware } from "../middlewares/authMiddleware"; // <-- Importe aqui

const router = Router();

// Adicione o authMiddleware aqui!
router.post("/", authMiddleware, ReviewController.create);

router.get("/user/:userId", ReviewController.getByReviewedUser);

export default router;
