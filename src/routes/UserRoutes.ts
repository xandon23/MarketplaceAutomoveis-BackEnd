import { Router } from "express";
import UserController from "../controllers/UserController";
import { authMiddleware } from "../middlewares/authMiddleware"; // Adicione esta importação

const router = Router();

router.post("/", UserController.create);
router.get("/", UserController.getAll);
router.get("/:id", UserController.getById);

// Adicione o authMiddleware aqui embaixo nestas duas:
router.put("/:id", authMiddleware, UserController.update);
router.delete("/:id", authMiddleware, UserController.delete);

export default router;
