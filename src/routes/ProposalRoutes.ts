import { Router } from "express";
import ProposalController from "../controllers/ProposalController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", authMiddleware, ProposalController.create);

router.get(
  "/vehicle/:vehicleId",
  authMiddleware,
  ProposalController.getByVehicle,
);

router.get("/:id", authMiddleware, ProposalController.getById);

router.put("/:id/status", authMiddleware, ProposalController.updateStatus);
router.patch("/:id/status", authMiddleware, ProposalController.updateStatus);

export default router;
