import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Review from "../models/Review";
import User from "../models/User";
import Proposal from "../models/Proposal";
import Vehicle from "../models/Vehicle";

export default class ReviewController {
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const reviewerId = req.userId;
      const { reviewedId, rating, comment } = req.body;

      if (!reviewerId) {
        return res.status(401).json({ error: "Usuário não autenticado." });
      }

      // 1. Validações Básicas
      if (reviewerId === reviewedId) {
        return res
          .status(403)
          .json({ error: "Operação negada: Não pode avaliar-se a si mesmo." });
      }

      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: "A nota deve ser um valor entre 1 e 5." });
      }

      // --- NOVA REGRA: Prevenir avaliações duplicadas ---
      const existingReview = await Review.findOne({
        where: {
          reviewerId: reviewerId,
          reviewedId: reviewedId,
        },
      });

      if (existingReview) {
        return res.status(403).json({
          error:
            "Operação negada: Você já avaliou este vendedor anteriormente. Apenas uma avaliação é permitida por usuário.",
        });
      }

      // --- 2. REGRA DE NEGÓCIO DE OURO: Validação de Negócio Fechado ---
      let hasClosedDeal = false;

      // Cenário A: O Avaliador foi quem COMPROU o carro do Avaliado
      const buyerProposals = await Proposal.findAll({
        where: { buyerId: reviewerId, status: "Aceita" },
      });

      for (const prop of buyerProposals) {
        const vehicle = await Vehicle.findByPk(prop.targetVehicleId);
        if (vehicle && vehicle.userId === reviewedId) {
          hasClosedDeal = true;
          break; // Encontrou um negócio, pode parar de procurar
        }
      }

      // Cenário B: O Avaliador foi quem VENDEU o carro para o Avaliado
      if (!hasClosedDeal) {
        const sellerProposals = await Proposal.findAll({
          where: { buyerId: reviewedId, status: "Aceita" },
        });

        for (const prop of sellerProposals) {
          const vehicle = await Vehicle.findByPk(prop.targetVehicleId);
          if (vehicle && vehicle.userId === reviewerId) {
            hasClosedDeal = true;
            break;
          }
        }
      }

      // Se não encontrou nenhum negócio aceite entre os dois, barra a avaliação!
      if (!hasClosedDeal) {
        return res.status(403).json({
          error:
            "Operação negada: Só pode avaliar utilizadores com os quais tenha um negócio fechado (Proposta Aceita).",
        });
      }
      // ----------------------------------------------------------------

      // Se passou por todas as barreiras, guarda a avaliação!
      const newReview = await Review.create({
        reviewerId,
        reviewedId,
        rating,
        comment,
      });

      return res.status(201).json({
        message: "Avaliação registada com sucesso!",
        review: newReview,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getByReviewedUser(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const reviews = await Review.findAll({
        where: { reviewedId: req.params.userId as string },
        include: [{ model: User, as: "reviewer", attributes: ["name"] }],
      });
      return res.status(200).json(reviews);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
