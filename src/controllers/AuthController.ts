import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUser } from "../types"; // Regra 4: Importação Global

export default class AuthController {
  /**
   * MÉTODOS PÚBLICOS (ORQUESTRADORES)
   */

  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;
      const user = await AuthController.getUser(email);

      // Regra 2: Casting para garantir que a senha não seja undefined
      await AuthController.checkPassword(password, user.password as string);
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

  private static issueToken(user: IUser): string {
    // Regra 3: Uso de Interface Global
    const secret = "SuaChaveSecretaSuperDificil123";
    // Regra 2: Casting de campos que podem ser opcionais na interface
    const payload = { id: user.id as string, name: user.name as string };
    return jwt.sign(payload, secret, { expiresIn: "1d" });
  }

  private static handleError(res: Response, err: Error): Response {
    const [msg, status] = err.message.split("|");
    const statusCode = status ? Number(status) : 500;
    return res.status(statusCode).json({ error: msg });
  }
}
