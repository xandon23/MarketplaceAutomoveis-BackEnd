import { Router } from "express";
import VehicleImageController from "../controllers/VehicleImageController";

const router = Router();

router.post("/", VehicleImageController.create);
router.delete("/:id", VehicleImageController.delete);

export default router;
