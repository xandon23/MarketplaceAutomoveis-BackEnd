import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Vehicle from "../models/Vehicle";
import User from "../models/User";
import VehicleImage from "../models/VehicleImage";
import sequelize from "../config/database";
import Proposal from "../models/Proposal";
import { Op } from "sequelize";
import { IVehicle } from "../types"; // Regra 4: Importação Global

export default class VehicleController {
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const data = req.body as IVehicle; // Regra 2: Casting do body
      VehicleController.validateVehicleData(data);

      const vehicle = await Vehicle.create({
        ...VehicleController.whitelist(data),
        status: "available",
        userId: req.userId,
      });

      return res
        .status(201)
        .json({ message: "Anunciado com sucesso!", vehicle });
    } catch (error) {
      return VehicleController.handleError(res, error, 400);
    }
  }

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, includeSold } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const where =
        includeSold === "true" ? {} : { status: { [Op.ne]: "sold" } };

      const { count, rows } = await Vehicle.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [["createdAt", "DESC"]],
        include: VehicleController.getIncludes(),
      });

      return res.status(200).json({
        total: count,
        totalPages: Math.ceil(count / Number(limit)),
        vehicles: rows,
      });
    } catch (error) {
      return VehicleController.handleError(res, error, 500);
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const id = req.params.id as string;
      const vehicle = await Vehicle.findByPk(id, {
        include: VehicleController.getIncludes(true),
      });

      if (!vehicle) throw new Error("Veículo não encontrado|404");
      return res.status(200).json(vehicle);
    } catch (error) {
      return VehicleController.handleError(res, error, 500);
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const id = req.params.id as string;
      const vehicle = await VehicleController.authorize(id, req.userId);

      await vehicle.update(VehicleController.whitelist(req.body as IVehicle));
      return res
        .status(200)
        .json({ message: "Anúncio atualizado com sucesso!" });
    } catch (error) {
      return VehicleController.handleError(res, error, 400);
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const id = req.params.id as string;
      const vehicle = await VehicleController.authorize(id, req.userId);
      await vehicle.destroy();
      return res.status(204).send();
    } catch (error) {
      return VehicleController.handleError(res, error, 500);
    }
  }

  static async sell(req: AuthRequest, res: Response): Promise<Response> {
    const t = await sequelize.transaction();
    try {
      const id = req.params.id as string;
      const vehicle = await VehicleController.authorize(id, req.userId);
      if (vehicle.status === "sold")
        throw new Error("Este veículo já consta como vendido|400");

      await vehicle.update(
        { status: "sold", buyerId: req.body.buyerId },
        { transaction: t },
      );
      await VehicleController.manageProposals(id, req.body.buyerId, t);
      await t.commit();
      return res.status(200).json({ message: "Venda finalizada com sucesso!" });
    } catch (error) {
      await t.rollback();
      return VehicleController.handleError(res, error, 500);
    }
  }

  private static validateVehicleData(d: IVehicle): void {
    const currentYear = new Date().getFullYear();
    const price = d.price as number;
    const mYear = d.modelYear as number;
    const fYear = d.manufactureYear as number;
    if (price <= 0) throw new Error("O preço deve ser maior que zero");
    if (mYear < fYear) throw new Error("Ano modelo inválido");
    if (mYear > fYear + 1)
      throw new Error("Modelo não pode ser superior a 1 ano");
    if (fYear > currentYear)
      throw new Error(`Ano não pode ser maior que ${currentYear}`);
  }

  private static whitelist(body: IVehicle) {
    const {
      brand,
      model,
      engine,
      transmission,
      location,
      mileage,
      price,
      description,
      features,
      manufactureYear,
      modelYear,
    } = body;
    return {
      brand,
      model,
      engine,
      transmission,
      location,
      mileage,
      price,
      description,
      features,
      manufactureYear,
      modelYear,
    };
  }

  private static async authorize(vId: string, uId?: string): Promise<Vehicle> {
    const v = await Vehicle.findByPk(vId);
    if (!v) throw new Error("Veículo não encontrado|404");
    if (String(v.userId) !== String(uId))
      throw new Error("Operação negada: Proprietário inválido|403");
    return v;
  }

  private static async manageProposals(
    vId: string,
    bId: string,
    t: any,
  ): Promise<void> {
    await Proposal.update(
      { status: "ACCEPTED" },
      { where: { targetVehicleId: vId, buyerId: bId }, transaction: t },
    );
    await Proposal.update(
      { status: "rejected" },
      {
        where: {
          targetVehicleId: vId,
          buyerId: { [Op.ne]: bId },
          status: ["pending", "in_negotiation"],
        },
        transaction: t,
      },
    );
  }

  private static getIncludes(withPhone = false) {
    const userAttrs = withPhone
      ? ["name", "email", "phone"]
      : ["name", "email"];
    return [
      { model: User, as: "user", attributes: userAttrs },
      { model: User, as: "Buyer", attributes: ["name"] },
      { model: VehicleImage, as: "images", attributes: ["id", "url"] },
    ];
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
