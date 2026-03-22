import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default class AuthController {
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      // 1. Verificar se o usuário existe
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: "E-mail ou senha inválidos." });
      }

      // 2. Comparar a senha digitada com o hash do banco
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "E-mail ou senha inválidos." });
      }

      // 3. Gerar o Token JWT (O "crachá" do usuário)
      // Em um projeto real, a 'SECRET_KEY' ficaria em um arquivo .env
      const token = jwt.sign(
        { id: user.id, name: user.name },
        "SuaChaveSecretaSuperDificil123",
        { expiresIn: "1d" }, // O login vale por 1 dia
      );

      return res.status(200).json({
        message: "Login realizado com sucesso!",
        user: { id: user.id, name: user.name, email: user.email },
        token: token,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
