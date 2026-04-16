import { Router } from "express";
import ProposalController from "../controllers/ProposalController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Rota para enviar proposta
router.post("/", authMiddleware, ProposalController.create);

// Rota para ver as propostas de um veículo (APENAS O DONO DO CARRO PODE VER)
// Adicionado authMiddleware para evitar erro de req.userId undefined
router.get(
  "/vehicle/:vehicleId",
  authMiddleware,
  ProposalController.getByVehicle,
);

// Rota para ver detalhes de uma proposta específica
router.get("/:id", authMiddleware, ProposalController.getById);

// Rotas para mudar o status da proposta (Aceitar/Recusar)
router.put("/:id/status", authMiddleware, ProposalController.updateStatus);
router.patch("/:id/status", authMiddleware, ProposalController.updateStatus);

export default router;
