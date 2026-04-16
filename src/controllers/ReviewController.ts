import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Review from "../models/Review";
import User from "../models/User";
import Vehicle from "../models/Vehicle";
import { Op } from "sequelize";
import { IReview } from "../types"; // Regra 4: Importação correta

export default class ReviewController {
  /**
   * MÉTODOS PÚBLICOS (ORQUESTRADORES)
   */

  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const data = req.body as IReview; // Regra 1 e 3: Tipagem e Proteção
      const reviewerId = req.userId as string;

      ReviewController.validateBasicRules(reviewerId, data);
      await ReviewController.checkDuplicateReview(reviewerId, data.reviewedId);
      await ReviewController.validateNegotiation(reviewerId, data.reviewedId);

      const review = await Review.create({
        reviewerId,
        reviewedId: data.reviewedId,
        rating: data.rating,
        comment: data.comment,
      });
      return res
        .status(201)
        .json({ message: "Avaliação registada com sucesso!", review });
    } catch (error) {
      return ReviewController.handleError(res, error as Error, 400);
    }
  }

  static async getByReviewedUser(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { userId } = req.params;
      const reviews = await Review.findAll({
        where: { reviewedId: userId },
        include: [{ model: User, as: "reviewer", attributes: ["name"] }],
      });
      return res.status(200).json(reviews);
    } catch (error) {
      return ReviewController.handleError(res, error as Error, 500);
    }
  }

  /**
   * MÉTODOS PRIVADOS (REGRAS TECH FORGE) - MÁXIMO 10 LINHAS CADA
   */

  private static validateBasicRules(revId: string, data: IReview): void {
    const targetId = data.reviewedId as string; // Regra 2: Casting de opcionais
    const rating = data.rating as number;

    if (!revId) throw new Error("Usuário não autenticado.|401");
    if (revId === targetId)
      throw new Error("Operação negada: Autoavaliação.|403");
    if (rating < 1 || rating > 5)
      throw new Error("Nota deve ser entre 1 e 5.|400");
  }

  private static async checkDuplicateReview(
    revId: string,
    targetId: string,
  ): Promise<void> {
    const exists = await Review.findOne({
      where: { reviewerId: revId, reviewedId: targetId },
    });
    if (exists) throw new Error("Operação negada: Avaliação já existente.|403");
  }

  private static async validateNegotiation(
    revId: string,
    targetId: string,
  ): Promise<void> {
    const closedDeal = await Vehicle.findOne({
      where: {
        status: "sold",
        [Op.or]: [
          { buyerId: revId, userId: targetId },
          { userId: revId, buyerId: targetId },
        ],
      },
    });
    if (!closedDeal)
      throw new Error("Operação negada: Sem negócio fechado.|403");
  }

  private static handleError(
    res: Response,
    err: Error,
    defaultStatus: number,
  ): Response {
    const [message, status] = err.message.split("|");
    const statusCode = status ? Number(status) : defaultStatus;
    return res.status(statusCode).json({ error: message });
  }
}
