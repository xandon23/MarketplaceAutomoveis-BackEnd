import { Request, Response } from "express";
import VehicleImage from "../models/VehicleImage";

export default class VehicleImageController {
  // POST: Adicionar uma foto a um veículo
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const newImage = await VehicleImage.create(req.body);
      return res
        .status(201)
        .json({ message: "Foto adicionada!", image: newImage });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // DELETE: Remover uma foto
  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const deleted = await VehicleImage.destroy({
        where: { id: req.params.id as string },
      });
      if (!deleted)
        return res.status(404).json({ error: "Foto não encontrada" });
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
