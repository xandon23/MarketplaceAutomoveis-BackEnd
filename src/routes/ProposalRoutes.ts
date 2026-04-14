import { Router } from "express";
import ProposalController from "../controllers/ProposalController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Rota para enviar proposta
router.post("/", authMiddleware, ProposalController.create);

// Rota para ver as propostas de um veículo (passando o ID do veículo na URL)
router.get("/vehicle/:vehicleId", ProposalController.getByVehicle);

// Rota para mudar o status da proposta (Aceitar/Recusar)
router.put("/:id/status", authMiddleware, ProposalController.updateStatus);

// PATCH é o método ideal para atualizar apenas um campo (o status)
router.patch("/:id/status", authMiddleware, ProposalController.updateStatus);

export default router;
