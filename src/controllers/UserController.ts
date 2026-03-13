import { Request, Response } from "express";
import User from "../models/User";

export default class UserController {
  // POST: Criar um novo utilizador
  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { birthDate } = req.body;

      // --- REGRA DE NEGÓCIO: Validação de Maioridade ---
      if (birthDate) {
        const dob = new Date(birthDate);
        const ageDifMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970); // Truque limpo para calcular a idade exata

        if (age < 18) {
          return res.status(403).json({
            error:
              "Acesso negado: É necessário ter 18 anos ou mais para criar uma conta e negociar.",
          });
        }
      }
      // ------------------------------------------------

      const newUser = await User.create(req.body);
      const userWithoutPassword = newUser.toJSON();
      delete (userWithoutPassword as any).password;

      return res
        .status(201)
        .json({ message: "Utilizador criado!", user: userWithoutPassword });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // GET: Listar todos os utilizadores (sem mostrar a palavra-passe)
  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const users = await User.findAll({
        attributes: { exclude: ["password"] },
      });
      return res.status(200).json(users);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET: Buscar apenas um utilizador pelo ID
  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const user = await User.findByPk(req.params.id as string, {
        attributes: { exclude: ["password"] },
      });
      if (!user)
        return res.status(404).json({ error: "Utilizador não encontrado" });
      return res.status(200).json(user);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // PUT: Atualizar dados do utilizador
  static async update(req: Request, res: Response): Promise<Response> {
    try {
      const user = await User.findByPk(req.params.id as string);
      if (!user)
        return res.status(404).json({ error: "Utilizador não encontrado" });

      await user.update(req.body);
      return res
        .status(200)
        .json({ message: "Dados atualizados com sucesso!" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // DELETE: Eliminar um utilizador
  static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const deleted = await User.destroy({ where: { id: req.params.id } });
      if (!deleted)
        return res.status(404).json({ error: "Utilizador não encontrado" });

      return res.status(204).send(); // 204 significa "Sem Conteúdo" (eliminado com sucesso)
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
