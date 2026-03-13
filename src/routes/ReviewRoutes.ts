import { Router } from "express";
import ReviewController from "../controllers/ReviewController";

const router = Router();

// Rota para criar a avaliação
router.post("/", ReviewController.create);

// Rota para ver as avaliações que um usuário recebeu
router.get("/user/:userId", ReviewController.getByReviewedUser);

export default router;
