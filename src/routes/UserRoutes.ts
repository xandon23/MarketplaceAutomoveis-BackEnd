import { Router } from "express";
import UserController from "../controllers/UserController";

const router = Router();

router.post("/", UserController.create); // Criar
router.get("/", UserController.getAll); // Listar todos
router.get("/:id", UserController.getById); // Buscar por ID
router.put("/:id", UserController.update); // Atualizar por ID
router.delete("/:id", UserController.delete); // Eliminar por ID

export default router;
