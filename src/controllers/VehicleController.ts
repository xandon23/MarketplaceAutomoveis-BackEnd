import { Request, Response } from "express";
import Vehicle from "../models/Vehicle";
import User from "../models/User";
import VehicleImage from "../models/VehicleImage"; // <-- 1. Nova importação aqui!

export default class VehicleController {
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const newVehicle = await Vehicle.create(req.body);
      return res
        .status(201)
        .json({ message: "Veículo anunciado!", vehicle: newVehicle });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // GET: A Vitrine Completa (Carro + Vendedor + Galeria de Fotos)
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const vehicles = await Vehicle.findAll({
        include: [
          { model: User, attributes: ["name", "email"] },
          { model: VehicleImage, attributes: ["id", "url"] }, // <-- 2. Adicionamos as fotos aqui!
        ],
      });
      return res.status(200).json(vehicles);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET: Buscar os detalhes de apenas um carro
  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const vehicle = await Vehicle.findByPk(req.params.id as string, {
        include: [
          { model: User, attributes: ["name", "email"] },
          { model: VehicleImage, attributes: ["id", "url"] }, // <-- 3. E aqui também!
        ],
      });
      if (!vehicle)
        return res.status(404).json({ error: "Veículo não encontrado" });
      return res.status(200).json(vehicle);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const vehicle = await Vehicle.findByPk(req.params.id as string);
      if (!vehicle)
        return res.status(404).json({ error: "Veículo não encontrado" });

      await vehicle.update(req.body);
      return res
        .status(200)
        .json({ message: "Anúncio atualizado com sucesso!" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const deleted = await Vehicle.destroy({
        where: { id: req.params.id as string },
      });
      if (!deleted)
        return res.status(404).json({ error: "Veículo não encontrado" });
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
