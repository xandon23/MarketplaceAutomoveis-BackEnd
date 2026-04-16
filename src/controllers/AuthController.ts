import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default class AuthController {
  /**
   * MÉTODOS PÚBLICOS (ORQUESTRADORES)
   */

  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;
      const user = await AuthController.getUser(email);

      await AuthController.checkPassword(password, user.password);
      const token = AuthController.issueToken(user);

      return res.status(200).json({
        message: "Login realizado com sucesso!",
        user: { id: user.id, name: user.name, email: user.email },
        token,
      });
    } catch (error) {
      return AuthController.handleError(res, error as Error);
    }
  }

  /**
   * MÉTODOS PRIVADOS (TECH FORGE & CLEAN CODE) - MÁXIMO 10 LINHAS CADA
   */

  private static async getUser(email: string): Promise<User> {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error("E-mail ou senha inválidos.|401");
    return user;
  }

  private static async checkPassword(
    plain: string,
    hashed: string,
  ): Promise<void> {
    const isValid = await bcrypt.compare(plain, hashed);
    if (!isValid) throw new Error("E-mail ou senha inválidos.|401");
  }

  private static issueToken(user: User): string {
    const secret = "SuaChaveSecretaSuperDificil123";
    const payload = { id: user.id, name: user.name };
    return jwt.sign(payload, secret, { expiresIn: "1d" });
  }

  private static handleError(res: Response, err: Error): Response {
    const [msg, status] = err.message.split("|");
    const statusCode = status ? Number(status) : 500;
    return res.status(statusCode).json({ error: msg });
  }
}
