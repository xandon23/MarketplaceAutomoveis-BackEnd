import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import VehicleImage from "../models/VehicleImage";
import Vehicle from "../models/Vehicle";
import { IVehicleImage } from "../types"; // Regra 4: Importação Global

export default class VehicleImageController {
  /**
   * MÉTODOS PÚBLICOS (ORQUESTRADORES)
   */

  static async upload(req: Request, res: Response): Promise<Response> {
    try {
      const { vehicleId } = req.params;
      if (!req.file) throw new Error("Nenhuma imagem foi enviada.|400");

      await VehicleImageController.checkVehicleExists(vehicleId as string);
      const url = `/uploads/${req.file.filename}`;
      const image = await VehicleImage.create({ vehicleId, url });

      return res.status(201).json(image as IVehicleImage);
    } catch (error) {
      return VehicleImageController.handleError(res, error as Error, 500);
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { imageId } = req.params;
      const image = await VehicleImageController.fetchImage(imageId as string);

      VehicleImageController.removePhysicalFile(image.url as string);
      await image.destroy();

      return res.status(200).json({ message: "Imagem deletada com sucesso." });
    } catch (error) {
      return VehicleImageController.handleError(res, error as Error, 500);
    }
  }

  /**
   * MÉTODOS PRIVADOS (TECH FORGE & CLEAN CODE) - MÁXIMO 10 LINHAS CADA
   */

  private static async checkVehicleExists(id: string): Promise<void> {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) throw new Error("Veículo não encontrado.|404");
  }

  private static async fetchImage(id: string): Promise<VehicleImage> {
    const image = await VehicleImage.findByPk(id);
    if (!image) throw new Error("Imagem não encontrada.|404");
    return image;
  }

  private static removePhysicalFile(url: string): void {
    const filename = url.split("/").pop();
    if (!filename) return;
    const filePath = path.resolve(__dirname, "..", "..", "uploads", filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  private static handleError(
    res: Response,
    err: Error,
    defStatus: number,
  ): Response {
    const [msg, status] = err.message.split("|");
    const statusCode = status ? Number(status) : defStatus;
    return res.status(statusCode).json({ error: msg });
  }
}
