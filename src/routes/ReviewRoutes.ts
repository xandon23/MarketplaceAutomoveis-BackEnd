import { Router } from "express";
import ReviewController from "../controllers/ReviewController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", authMiddleware, ReviewController.create);

router.get("/user/:userId", ReviewController.getByReviewedUser);

export default router;
