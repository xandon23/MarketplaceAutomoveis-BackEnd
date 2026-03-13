import { Request, Response } from "express";
import Proposal from "../models/Proposal";
import User from "../models/User";
import Vehicle from "../models/Vehicle"; // <-- 1. Adicionamos a importação do Veículo

export default class ProposalController {
  // POST: O Comprador envia uma proposta
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { buyerId, targetVehicleId, offeredVehicleId } = req.body;

      // --- NOVA REGRA: Não pode comprar o próprio carro ---
      const targetVehicle = await Vehicle.findByPk(targetVehicleId);
      if (!targetVehicle) {
        return res
          .status(404)
          .json({ error: "O veículo desejado não existe." });
      }

      if (targetVehicle.userId === buyerId) {
        return res.status(403).json({
          error:
            "Operação negada: Você não pode fazer uma proposta para o seu próprio veículo.",
        });
      }
      // ----------------------------------------------------

      // --- REGRA DE NEGÓCIO: Validação do Veículo de Troca ---
      if (offeredVehicleId) {
        const offeredVehicle = await Vehicle.findByPk(offeredVehicleId);
        if (!offeredVehicle)
          return res
            .status(404)
            .json({ error: "O veículo oferecido na troca não existe." });

        if (offeredVehicle.userId !== buyerId) {
          return res
            .status(403)
            .json({
              error: "Operação negada: O veículo de troca deve ser seu.",
            });
        }
      }
      // --------------------------------------------------------

      const newProposal = await Proposal.create(req.body);
      return res
        .status(201)
        .json({
          message: "Proposta enviada com sucesso!",
          proposal: newProposal,
        });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // GET: O Vendedor vê todas as propostas feitas para um carro específico
  static async getByVehicle(req: Request, res: Response): Promise<Response> {
    try {
      const proposals = await Proposal.findAll({
        where: { targetVehicleId: req.params.vehicleId as string },
        include: [{ model: User, attributes: ["name", "email"] }],
      });
      return res.status(200).json(proposals);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // PUT: O Vendedor aceita ou recusa a proposta
  static async updateStatus(req: Request, res: Response): Promise<Response> {
    try {
      const proposal = await Proposal.findByPk(req.params.id as string);
      if (!proposal)
        return res.status(404).json({ error: "Proposta não encontrada" });

      proposal.status = req.body.status;
      await proposal.save();

      return res
        .status(200)
        .json({ message: `Proposta atualizada para: ${proposal.status}` });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
