import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Review from "../models/Review";
import User from "../models/User";
import Vehicle from "../models/Vehicle";
import { Op } from "sequelize";

export default class ReviewController {
  /**
   * MÉTODOS PÚBLICOS (ORQUESTRADORES)
   */

  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { reviewedId, rating, comment } = req.body;
      const reviewerId = req.userId as string;

      ReviewController.validateBasicRules(reviewerId, reviewedId, rating);
      await ReviewController.checkDuplicateReview(reviewerId, reviewedId);
      await ReviewController.validateNegotiation(reviewerId, reviewedId);

      const review = await Review.create({
        reviewerId,
        reviewedId,
        rating,
        comment,
      });
      return res
        .status(201)
        .json({ message: "Avaliação registada com sucesso!", review });
    } catch (error) {
      const err = error as Error;
      return ReviewController.handleError(res, err, 400);
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
      const err = error as Error;
      return ReviewController.handleError(res, err, 500);
    }
  }

  /**
   * MÉTODOS PRIVADOS (REGRAS TECH FORGE) - MÁXIMO 10 LINHAS CADA
   */

  private static validateBasicRules(
    revId: string,
    targetId: string,
    rating: number,
  ): void {
    if (!revId) throw new Error("Usuário não autenticado.|401");
    if (revId === targetId)
      throw new Error("Operação negada: Não pode avaliar-se a si mesmo.|403");
    if (rating < 1 || rating > 5)
      throw new Error("A nota deve ser um valor entre 1 e 5.|400");
  }

  private static async checkDuplicateReview(
    revId: string,
    targetId: string,
  ): Promise<void> {
    const exists = await Review.findOne({
      where: { reviewerId: revId, reviewedId: targetId },
    });
    if (exists) {
      throw new Error(
        "Operação negada: Você já avaliou este vendedor anteriormente.|403",
      );
    }
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
    if (!closedDeal) {
      throw new Error(
        "Operação negada: Só pode avaliar quem tem negócio fechado.|403",
      );
    }
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
