import { Router } from "express";
import multer from "multer";
import { multerConfig } from "../config/multer";
import VehicleController from "../controllers/VehicleController";
import VehicleImageController from "../controllers/VehicleImageController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
const upload = multer(multerConfig);

// === ROTAS PRINCIPAIS DE VEÍCULOS ===
// PÚBLICAS
router.get("/", VehicleController.getAll);
router.get("/:id", VehicleController.getById);

// PROTEGIDAS (Apenas utilizadores autenticados)
router.post("/", authMiddleware, VehicleController.create);
router.put("/:id", authMiddleware, VehicleController.update);
router.delete("/:id", authMiddleware, VehicleController.delete);
router.patch("/:id/sell", authMiddleware, VehicleController.sell); // Finalizar venda

// === ROTAS DE IMAGENS DOS VEÍCULOS ===
// PROTEGIDAS (Apenas utilizadores autenticados)
router.post(
  "/:vehicleId/images",
  authMiddleware,
  upload.single("image"),
  VehicleImageController.upload,
);
router.delete(
  "/images/:imageId",
  authMiddleware,
  VehicleImageController.delete,
);

export default router;
