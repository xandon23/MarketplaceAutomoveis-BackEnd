import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Proposal from "../models/Proposal";
import User from "../models/User";
import Vehicle from "../models/Vehicle";

export default class ProposalController {
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { targetVehicleId, offeredVehicleId } = req.body;
      const loggedUserId = req.userId; // ID do comprador vem do Token

      const targetVehicle = await Vehicle.findByPk(targetVehicleId);
      if (!targetVehicle)
        return res.status(404).json({ error: "Veículo não encontrado." });

      if (targetVehicle.userId === loggedUserId) {
        return res
          .status(403)
          .json({
            error: "Você não pode propor a compra do seu próprio carro!",
          });
      }

      // Validação do carro de troca (precisa ser do comprador)
      if (offeredVehicleId) {
        const offeredVehicle = await Vehicle.findByPk(offeredVehicleId);
        if (!offeredVehicle || offeredVehicle.userId !== loggedUserId) {
          return res
            .status(403)
            .json({ error: "O veículo de troca deve pertencer a você." });
        }
      }

      const newProposal = await Proposal.create({
        ...req.body,
        buyerId: loggedUserId, // Forçamos o ID do comprador real
      });

      return res
        .status(201)
        .json({ message: "Proposta enviada!", proposal: newProposal });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // PUT: Aceitar ou Recusar (Somente o Vendedor)
  static async updateStatus(
    req: AuthRequest,
    res: Response,
  ): Promise<Response> {
    try {
      const { id } = req.params as { id: string };
      const loggedUserId = req.userId;

      const proposal = await Proposal.findByPk(id, { include: [Vehicle] });
      if (!proposal)
        return res.status(404).json({ error: "Proposta não encontrada." });

      // --- VALIDAÇÃO DE SEGURANÇA ---
      // Verificamos se quem está tentando aceitar é o DONO do carro anunciado
      if (proposal.targetVehicle.userId !== loggedUserId) {
        return res.status(403).json({
          error:
            "Apenas o vendedor do veículo pode aceitar ou recusar propostas.",
        });
      }

      proposal.status = req.body.status;
      await proposal.save();

      return res
        .status(200)
        .json({
          message: `Status da proposta atualizado para: ${proposal.status}`,
        });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // GET: Listar propostas recebidas por um veículo
  static async getByVehicle(
    req: AuthRequest,
    res: Response,
  ): Promise<Response> {
    try {
      const { vehicleId } = req.params as { vehicleId: string };
      const proposals = await Proposal.findAll({
        where: { targetVehicleId: vehicleId },
        include: [{ model: User, as: "buyer", attributes: ["name", "phone"] }],
      });
      return res.status(200).json(proposals);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
