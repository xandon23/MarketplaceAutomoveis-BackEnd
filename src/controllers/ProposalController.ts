import { Response, Request } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Proposal from "../models/Proposal";
import User from "../models/User";
import Vehicle from "../models/Vehicle";
import VehicleImage from "../models/VehicleImage";

export default class ProposalController {
  /**
   * MÉTODOS PÚBLICOS (ORQUESTRADORES)
   */

  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { targetVehicleId, cashOffer, offeredVehicleId, message } =
        req.body;
      const vehicle = await ProposalController.fetchVehicle(targetVehicleId);

      ProposalController.validateProposalRules(
        vehicle,
        req.userId as string,
        cashOffer,
        !!offeredVehicleId,
      );
      if (offeredVehicleId)
        await ProposalController.validateTradeIn(
          offeredVehicleId,
          req.userId as string,
        );

      const proposal = await Proposal.create({
        targetVehicleId,
        buyerId: req.userId,
        cashOffer,
        offeredVehicleId: offeredVehicleId || null,
        status: "pending",
        message: message || null,
      });
      return res
        .status(201)
        .json({ message: "Proposta enviada com sucesso!", proposal });
    } catch (error) {
      return ProposalController.handleError(res, error, 400);
    }
  }

  static async updateStatus(
    req: AuthRequest,
    res: Response,
  ): Promise<Response> {
    try {
      const { status } = req.body;
      const proposal = await ProposalController.authorizeStatusUpdate(
        req.params.id as string,
        req.userId as string,
        status,
      );

      await proposal.update({ status });
      const msg =
        status === "REJECTED"
          ? "Negociação cancelada."
          : "Negociação iniciada!";
      return res.status(200).json({ message: msg, proposal });
    } catch (error) {
      return ProposalController.handleError(res, error, 400);
    }
  }

  static async getByVehicle(req: Request, res: Response): Promise<Response> {
    try {
      const proposals = await Proposal.findAll({
        where: { targetVehicleId: req.params.vehicleId },
        include: [
          { model: User, as: "buyer", attributes: ["name", "phone"] },
          { model: Vehicle, as: "offeredVehicle" },
        ],
      });
      return res.status(200).json(proposals);
    } catch (error) {
      return ProposalController.handleError(res, error, 500);
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const proposal = await Proposal.findByPk(req.params.id as string, {
        include: [
          { model: User, as: "buyer", attributes: ["name", "phone", "email"] },
          {
            model: Vehicle,
            as: "offeredVehicle",
            include: [{ model: VehicleImage, as: "images" }],
          },
        ],
      });
      if (!proposal) throw new Error("Proposta não encontrada.|404");
      return res.status(200).json(proposal);
    } catch (error) {
      return ProposalController.handleError(res, error, 500);
    }
  }

  /**
   * MÉTODOS PRIVADOS (TECH FORGE & CLEAN CODE)
   */

  private static async fetchVehicle(id: string): Promise<Vehicle> {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) throw new Error("Veículo não encontrado.|404");
    return vehicle;
  }

  private static validateProposalRules(
    v: Vehicle,
    uid: string,
    cash: number,
    hasTrade: boolean,
  ): void {
    if (!hasTrade && cash <= 0)
      throw new Error("Valor deve ser maior que zero sem troca.|400");
    if (hasTrade && cash < 0)
      throw new Error("Valor não pode ser negativo.|400");
    if (v.userId === uid)
      throw new Error("Não pode propor no seu próprio veículo.|400");
    if (v.status !== "available")
      throw new Error("Veículo indisponível para propostas.|400");
  }

  private static async validateTradeIn(
    oid: string,
    uid: string,
  ): Promise<void> {
    const offered = await Vehicle.findByPk(oid);
    if (!offered || offered.userId !== uid)
      throw new Error("O veículo de troca deve ser seu.|403");
    if (offered.status !== "available")
      throw new Error("Veículo de troca indisponível.|400");
  }

  private static async authorizeStatusUpdate(
    id: string,
    uid: string,
    status: string,
  ): Promise<Proposal> {
    if (!["PENDING", "ACCEPTED", "REJECTED"].includes(status))
      throw new Error("Status inválido.|400");
    const p = await Proposal.findByPk(id, {
      include: [{ model: Vehicle, as: "targetVehicle" }],
    });
    if (!p) throw new Error("Proposta não encontrada.|404");
    if (p.targetVehicle?.userId !== uid)
      throw new Error("Acesso negado: você não é o dono.|403");
    return p;
  }

  private static handleError(
    res: Response,
    error: unknown,
    defaultStatus: number,
  ): Response {
    const err = error as Error;
    const [msg, status] = err.message.split("|");
    return res
      .status(status ? Number(status) : defaultStatus)
      .json({ error: msg });
  }
}
