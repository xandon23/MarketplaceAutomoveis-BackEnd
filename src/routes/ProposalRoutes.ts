import { Router } from "express";
import ProposalController from "../controllers/ProposalController";

const router = Router();

// Rota para enviar proposta
router.post("/", ProposalController.create);

// Rota para ver as propostas de um veículo (passando o ID do veículo na URL)
router.get("/vehicle/:vehicleId", ProposalController.getByVehicle);

// Rota para mudar o status da proposta (Aceitar/Recusar)
router.put("/:id/status", ProposalController.updateStatus);

export default router;
