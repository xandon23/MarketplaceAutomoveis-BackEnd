import { Request, Response } from "express";
import User from "../models/User";
import { validarCPF } from "../utils/validators";
import { AuthRequest } from "../middlewares/authMiddleware";

export default class UserController {
  /**
   * MÉTODOS PÚBLICOS (ORQUESTRADORES)
   */

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { name, email, password, cpf, birthDate, phone } = req.body;

      UserController.validateRegisterData(req.body);
      await UserController.checkDuplicity(email, cpf);

      const user = await User.create({
        name,
        email,
        password,
        phone,
        birthDate,
        cpf: cpf.replace(/\D/g, ""),
      });

      return res.status(201).json(user);
    } catch (error) {
      return UserController.handleError(res, error, 400);
    }
  }

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const users = await User.findAll({
        attributes: { exclude: ["password"] },
        limit: Number(limit),
        offset: offset,
      });
      return res.status(200).json(users);
    } catch (error) {
      return UserController.handleError(res, error, 500);
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const user = await User.findByPk(req.params.id as string, {
        attributes: { exclude: ["password"] },
      });
      if (!user) throw new Error("Utilizador não encontrado|404");
      return res.status(200).json(user);
    } catch (error) {
      return UserController.handleError(res, error, 500);
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const user = await UserController.validateOwnership(req);
      const { name, phone, email } = req.body;

      UserController.validateUpdateData(name, phone, email, user.email);

      await user.update({ name, phone });
      return res.status(200).json({
        message: "Dados atualizados com sucesso!",
        user: { name, phone, email: user.email },
      });
    } catch (error) {
      return UserController.handleError(res, error, 400);
    }
  }

  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const deleted = await User.destroy({ where: { id: req.params.id } });
      if (!deleted) throw new Error("Utilizador não encontrado|404");
      return res.status(204).send();
    } catch (error) {
      return UserController.handleError(res, error, 500);
    }
  }

  /**
   * MÉTODOS PRIVADOS (LÓGICA E VALIDAÇÕES) - MÁXIMO 10 LINHAS CADA
   */

  private static validateRegisterData(data: any): void {
    const { email, password, cpf, birthDate } = data;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("E-mail inválido");
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password))
      throw new Error("Senha fraca");
    if (!validarCPF(cpf)) throw new Error("CPF inválido");
    if (!UserController.isOfAge(birthDate))
      throw new Error("Menor de idade|403");
  }

  private static isOfAge(birthDate: string): boolean {
    const dataNasc = new Date(birthDate);
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNasc.getFullYear();
    const m = hoje.getMonth() - dataNasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) idade--;
    return idade >= 18;
  }

  private static async checkDuplicity(
    email: string,
    cpf: string,
  ): Promise<void> {
    const cleanCpf = cpf.replace(/\D/g, "");
    const exists = await User.findOne({ where: { email } });
    const cpfExists = await User.findOne({ where: { cpf: cleanCpf } });
    if (exists || cpfExists)
      throw new Error("E-mail ou CPF já cadastrados|409");
  }

  private static async validateOwnership(req: AuthRequest): Promise<User> {
    if (req.userId !== req.params.id) throw new Error("Acesso negado|403");
    const user = await User.findByPk(req.params.id);
    if (!user) throw new Error("Utilizador não encontrado|404");
    return user;
  }

  private static validateUpdateData(
    name: string,
    phone: string,
    email: string,
    dbEmail: string,
  ): void {
    if (!name || !phone) throw new Error("Nome e telefone obrigatórios");
    if (email && email !== dbEmail)
      throw new Error("Alteração de e-mail proibida|403");
  }

  private static handleError(
    res: Response,
    error: unknown,
    defaultStatus: number,
  ): Response {
    const err = error as Error;
    const [message, status] = err.message.split("|");
    const statusCode = status ? Number(status) : defaultStatus;
    return res.status(statusCode).json({ error: message });
  }
}
