import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Vehicle from "../models/Vehicle";
import User from "../models/User";
import VehicleImage from "../models/VehicleImage";
import sequelize from "../config/database";
import Proposal from "../models/Proposal";
import { Op } from "sequelize";

export default class VehicleController {
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      // PEGANDO O ID DIRETAMENTE DO TOKEN (Segurança Máxima)
      const loggedUserId = req.userId;
      const {
        brand,
        model,
        manufactureYear, // 👈 Se atente a esses nomes!
        modelYear,
        engine,
        transmission,
        location,
        mileage,
        price,
        description,
        features,
      } = req.body;

      // --- INÍCIO DAS VALIDAÇÕES (REGRAS DE NEGÓCIO) ---

      // 1. Validação de Preço
      if (price <= 0) {
        return res
          .status(400)
          .json({ error: "O preço do veículo deve ser maior que zero." });
      }

      // 2. Validação de Ano: Fabricação vs Modelo
      if (modelYear < manufactureYear) {
        return res.status(400).json({
          error: "O ano do modelo não pode ser menor que o ano de fabricação.",
        });
      }

      if (modelYear > manufactureYear + 1) {
        return res.status(400).json({
          error:
            "O modelo do veículo não pode ser superior a 1 ano do ano de fabricação.",
        });
      }

      // 3. Validação de "Carro do Futuro"
      const currentYear = new Date().getFullYear();
      if (manufactureYear > currentYear) {
        return res.status(400).json({
          error: `O ano de fabricação não pode ser maior que o ano atual (${currentYear}).`,
        });
      }

      // --- FIM DAS VALIDAÇÕES ---

      // Criamos o veículo injetando o ID do usuário logado e definindo o status inicial
      const newVehicle = await Vehicle.create({
        brand,
        model,
        manufactureYear,
        modelYear,
        engine,
        transmission,
        location,
        mileage,
        price,
        description,
        features,
        status: "available",
        userId: req.userId, // Pega o dono do token!
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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const { includeSold } = req.query;
      const whereCondition: any = {};

      // Se NÃO vier '?includeSold=true' na URL, escondemos os vendidos da vitrine
      if (includeSold !== "true") {
        whereCondition.status = { [Op.ne]: "sold" };
      }

      const { count, rows } = await Vehicle.findAndCountAll({
        where: whereCondition, // <--- Agora usamos a condição variável
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        include: [
          // 1. O dono do veículo (Precisamos avisar que o apelido dele é 'user')
          { model: User, as: "user", attributes: ["name", "email"] },

          // 2. O comprador do veículo (Já havíamos colocado o apelido 'Buyer')
          { model: User, as: "Buyer", attributes: ["name"] },

          // 3. As imagens
          { model: VehicleImage, attributes: ["id", "url"], as: "images" },
        ],
      });

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
          // Avisa que o dono se chama 'user'
          { model: User, as: "user", attributes: ["name", "email", "phone"] }, // adicione phone se precisar na página do anúncio

          // Avisa que o comprador se chama 'Buyer'
          { model: User, as: "Buyer", attributes: ["name"] },

          // As imagens
          { model: VehicleImage, attributes: ["id", "url"], as: "images" },
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

  static async sell(req: AuthRequest, res: Response): Promise<Response> {
    const transaction = await sequelize.transaction(); // Inicia a operação casada

    try {
      const { id } = req.params; // ID do Veículo
      const { buyerId } = req.body; // ID do comprador
      console.log("💥 DADOS QUE CHEGARAM:", req.body);
      const loggedUserId = req.userId;

      // 1. Busca o veículo
      const vehicle = await Vehicle.findByPk(String(id));
      if (!vehicle)
        return res.status(404).json({ error: "Veículo não encontrado." });

      // 2. Trava: Só o dono pode vender
      if (vehicle.userId !== loggedUserId) {
        return res
          .status(403)
          .json({ error: "Apenas o proprietário pode registrar a venda." });
      }

      // 3. Trava: O veículo já foi vendido?
      if (vehicle.status === "sold") {
        return res
          .status(400)
          .json({ error: "Este veículo já consta como vendido." });
      }

      // --- INÍCIO DA MÁGICA DA TRANSAÇÃO ---

      // A) Marca o veículo como vendido
      await vehicle.update(
        {
          status: "sold",
          buyerId: buyerId, // 👈 Salve o ID do comprador no registro do veículo
        },
        { transaction },
      );

      // B) Marca a proposta vencedora como 'ACCEPTED' (ganha/concluída)
      const [linhasAtualizadas] = await Proposal.update(
        { status: "ACCEPTED" },
        {
          where: {
            targetVehicleId: id, // O carro que está sendo vendido
            buyerId: buyerId, // O comprador escolhido
            status: "ACCEPTED", // Garante que estamos afetando a proposta certa
          },
          transaction, // Mantenha isso se você abriu a transação lá em cima
        },
      );

      console.log("💥 LINHAS ATUALIZADAS (WON):", linhasAtualizadas);

      // C) Pulo do Gato: Rejeita TODAS as outras propostas desse carro
      const { Op } = require("sequelize"); // Importe os operadores do Sequelize no topo se não tiver
      await Proposal.update(
        { status: "rejected" },
        {
          where: {
            targetVehicleId: id,
            buyerId: { [Op.ne]: buyerId }, // [Op.ne] significa "Not Equal" (Diferente de)
            status: { [Op.in]: ["pending", "in_negotiation"] }, // Só recusa as que estavam abertas
          },
          transaction,
        },
      );

      // Se nenhuma linha de código quebrou, a gente salva tudo no banco de vez!
      await transaction.commit();

      return res.status(200).json({
        message: "Venda finalizada com sucesso! Veículo saiu da vitrine.",
      });
    } catch (error: any) {
      // Se algo deu errado, desfaz tudo (Rollback)
      // 👇 Esta linha vai imprimir no terminal a fofoca inteira do Sequelize!
      console.error("💥 ERRO REAL DO SEQUELIZE:", error);

      // 👇 E aqui devolvemos a mensagem técnica pro teste ver
      return res.status(500).json({ error: error.message });
    }
  }
}
