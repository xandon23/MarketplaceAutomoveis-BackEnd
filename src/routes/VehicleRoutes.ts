import { Router } from "express";
import VehicleController from "../controllers/VehicleController";
import { authMiddleware } from "../middlewares/authMiddleware"; // <-- Importe aqui

const router = Router();

// Rotas PÚBLICAS (Qualquer um pode ver os carros)
router.get("/", VehicleController.getAll);
router.get("/:id", VehicleController.getById);

// Rotas PROTEGIDAS (Só quem está logado pode anunciar ou mexer no anúncio)
router.post("/", authMiddleware, VehicleController.create);
router.put("/:id", authMiddleware, VehicleController.update);
router.delete("/:id", authMiddleware, VehicleController.delete);
// POST ou PATCH para finalizar a venda do veículo
router.patch("/:id/sell", authMiddleware, VehicleController.sell);

export default router;
