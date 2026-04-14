import { Router } from "express";
import VehicleImageController from "../controllers/VehicleImageController";

// 1. Importar o Multer e a sua configuração
import multer from "multer";
import { multerConfig } from "../config/multer";

// 2. Importar o seu middleware de autenticação (ajuste o caminho se necessário)
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
const upload = multer(multerConfig);

// POST: Fazer upload de foto para um carro específico
router.post(
  "/:vehicleId/images",
  authMiddleware,
  upload.single("image"),
  VehicleImageController.upload,
);

// DELETE: Deletar uma foto específica pelo ID dela
router.delete(
  "/images/:imageId",
  authMiddleware,
  VehicleImageController.delete,
);

export default router;
