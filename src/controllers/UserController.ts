import { Request, Response } from "express";
import User from "../models/User";

export default class UserController {
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const newUser = await User.create(req.body);

      // Retornamos 201 (Created) e não devolvemos a senha por segurança
      return res.status(201).json({
        message: "Usuário cadastrado com sucesso!",
        id: newUser.id,
      });
    } catch (error: any) {
      // Retornamos 400 (Bad Request) se der erro de validação (CPF, Senha, etc)
      return res.status(400).json({ error: error.message });
    }
  }
}
