import { Response, Request } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Proposal from "../models/Proposal";
import User from "../models/User";
import Vehicle from "../models/Vehicle";
import VehicleImage from "../models/VehicleImage";
import { IProposal, IVehicle } from "../types";

export default class ProposalController {
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.userId as string;
      const data = req.body as IProposal;

      const vModel = await ProposalController.fetchVehicle(
        data.targetVehicleId as string,
      );

      const vehicle = vModel.get({ plain: true }) as IVehicle;

      ProposalController.validateProposalRules(vehicle, userId, data);
      if (data.offeredVehicleId) {
        await ProposalController.validateTradeIn(
          data.offeredVehicleId as string,
          userId,
        );
      }

      const proposal = await Proposal.create({
        targetVehicleId: data.targetVehicleId,
        buyerId: userId,
        cashOffer: data.cashOffer,
        offeredVehicleId: data.offeredVehicleId || null,
        status: "pending",
        message: data.message || null,
      });

      return res.status(201).json({ message: "Proposta enviada!", proposal });
    } catch (error) {
      const err = error as Error;
      return ProposalController.handleError(res, err, 400);
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

  private static async fetchVehicle(id: string): Promise<Vehicle> {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) throw new Error("Veículo não encontrado.|404");
    return vehicle;
  }

  private static validateProposalRules(
    v: IVehicle,
    uid: string,
    data: IProposal,
  ): void {
    const cash = data.cashOffer as number;
    const hasTrade = !!data.offeredVehicleId;
    if (!hasTrade && cash <= 0)
      throw new Error("Valor deve ser maior que zero.|400");
    if (hasTrade && cash < 0)
      throw new Error("Valor não pode ser negativo.|400");
    if (v.userId === uid)
      throw new Error("Não pode propor no seu veículo.|400");
    if (v.status !== "available") throw new Error("Veículo indisponível.|400");
  }

  private static async validateTradeIn(
    oid: string,
    uid: string,
  ): Promise<void> {
    const offered = await Vehicle.findByPk(oid);
    if (!offered || offered.userId !== uid)
      throw new Error("O veículo deve ser seu.|403");
    if (offered.status !== "available")
      throw new Error("Veículo indisponível.|400");
  }

  private static async authorizeStatusUpdate(
    id: string,
    uid: string,
    st: string,
  ): Promise<Proposal> {
    if (!["PENDING", "ACCEPTED", "REJECTED"].includes(st))
      throw new Error("Status inválido.|400");
    const p = await Proposal.findByPk(id, {
      include: [{ model: Vehicle, as: "targetVehicle" }],
    });
    if (!p) throw new Error("Proposta não encontrada.|404");
    if ((p as any).targetVehicle?.userId !== uid)
      throw new Error("Acesso negado.|403");
    return p;
  }

  private static handleError(
    res: Response,
    error: unknown,
    defStatus: number,
  ): Response {
    const err = error as Error;
    const [msg, status] = err.message.split("|");
    return res.status(status ? Number(status) : defStatus).json({ error: msg });
  }
}
