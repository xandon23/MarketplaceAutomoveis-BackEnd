import { Router } from "express";
import VehicleController from "../controllers/VehicleController";

const router = Router();

router.post("/", VehicleController.create);
router.get("/", VehicleController.getAll); // A Vitrine
router.get("/:id", VehicleController.getById); // Detalhes do Carro
router.put("/:id", VehicleController.update); // Editar Anúncio
router.delete("/:id", VehicleController.delete); // Excluir Anúncio

export default router;
