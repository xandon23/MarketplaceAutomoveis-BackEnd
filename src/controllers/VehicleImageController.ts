import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import VehicleImage from "../models/VehicleImage";
import Vehicle from "../models/Vehicle";

export default class VehicleImageController {
  // POST: Adicionar uma foto a um veículo
  static async upload(req: Request, res: Response) {
    try {
      const { vehicleId } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem foi enviada." });
      }

      const vehicle = await Vehicle.findByPk(vehicleId as string);
      if (!vehicle) {
        return res.status(404).json({ error: "Veículo não encontrado." });
      }

      // Salvamos o caminho relativo para o João usar no Front
      const image = await VehicleImage.create({
        vehicleId,
        url: `/uploads/${req.file.filename}`,
      });

      return res.status(201).json(image);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: "Erro ao processar upload da imagem." });
    }
  }

  // DELETE: Remover uma foto
  static async delete(req: Request, res: Response) {
    try {
      const { imageId } = req.params;

      // 1. Busca a imagem no banco de dados
      const image = await VehicleImage.findByPk(imageId as string);
      if (!image) {
        return res.status(404).json({ error: "Imagem não encontrada." });
      }

      // 2. Apaga o arquivo físico da pasta uploads
      // A URL está salva como "/uploads/8f9a-foto.jpg". O .split('/').pop() pega só o "8f9a-foto.jpg"
      const filename = image.url.split("/").pop();

      if (filename) {
        // Monta o caminho exato de onde o arquivo deveria estar no servidor
        const filePath = path.resolve(
          __dirname,
          "..",
          "..",
          "uploads",
          filename,
        );

        // Se o arquivo realmente existir na pasta, nós deletamos (unlinkSync)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // 3. Deleta o registro do banco de dados
      await image.destroy();

      return res.status(200).json({ message: "Imagem deletada com sucesso." });
    } catch (error: any) {
      console.error("Erro ao deletar imagem:", error);
      return res
        .status(500)
        .json({ error: "Erro interno ao deletar a imagem." });
    }
  }
}
