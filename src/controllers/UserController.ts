import { Request, Response } from "express";
import User from "../models/User";

export default class UserController {
  // POST: Criar um novo utilizador
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
