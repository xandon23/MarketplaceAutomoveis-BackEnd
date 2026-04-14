import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Vehicle from "../models/Vehicle";
import User from "../models/User";
import VehicleImage from "../models/VehicleImage"; // <-- 1. Nova importação aqui!

export default class VehicleController {
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      // PEGANDO O ID DIRETAMENTE DO TOKEN (Segurança Máxima)
      const loggedUserId = req.userId;

      // Criamos o veículo injetando o ID do usuário logado e o restante do corpo da requisição
      const newVehicle = await Vehicle.create({
        ...req.body,
        userId: loggedUserId, // Sobrescreve qualquer userId que venha no JSON
      });

      return res.status(201).json({
        message: "Veículo anunciado com sucesso!",
        vehicle: newVehicle,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // GET: A Vitrine Completa (Carro + Vendedor + Galeria de Fotos)
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Configuração da Paginação (Captura da URL ou usa padrão)
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // 2. Busca paginada com Eager Loading (incluindo Fotos e Usuário)
      const { count, rows } = await Vehicle.findAndCountAll({
        limit,
        offset,
        order: [["createdAt", "DESC"]], // Ordem decrescente (mais novos primeiro)
        include: [
          { model: User, attributes: ["name", "email"] },
          { model: VehicleImage, attributes: ["id", "url"] },
        ],
      });

      // 3. Retorno com metadados (O João vai precisar disso para criar os botões de "Próxima Página")
      return res.status(200).json({
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        vehicles: rows,
      });
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

  // PUT: Atualizar o anúncio
  static async update(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const loggedUserId = req.userId;

      const vehicle = await Vehicle.findByPk(id as string);

      if (!vehicle) {
        return res.status(404).json({ error: "Veículo não encontrado." });
      }

      // --- REGRA DE OURO: Só o dono mexe! ---
      if (vehicle.userId !== loggedUserId) {
        return res.status(403).json({
          error:
            "Operação negada: Você não tem permissão para editar um anúncio que não é seu.",
        });
      }

      await vehicle.update(req.body);
      return res
        .status(200)
        .json({ message: "Anúncio atualizado com sucesso!" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // DELETE: Apagar o anúncio
  static async delete(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const loggedUserId = req.userId;

      const vehicle = await Vehicle.findByPk(id as string);

      if (!vehicle) {
        return res.status(404).json({ error: "Veículo não encontrado." });
      }

      // --- REGRA DE OURO: Só o dono apaga! ---
      if (vehicle.userId !== loggedUserId) {
        return res.status(403).json({
          error:
            "Operação negada: Você não pode excluir o anúncio de outro usuário.",
        });
      }

      await vehicle.destroy();
      return res.status(204).send(); // 204 significa "Sucesso, mas sem conteúdo para retornar"
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
