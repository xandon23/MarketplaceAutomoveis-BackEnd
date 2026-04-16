import { Request, Response } from "express";
import User from "../models/User";
import { validarCPF } from "../utils/validators";
import { AuthRequest } from "../middlewares/authMiddleware";

export default class UserController {
  // POST: Criar um novo utilizador
  static async create(req: Request, res: Response) {
    try {
      const { name, email, password, cpf, birthDate, phone } = req.body;

      // 1. VALIDAÇÃO DE MAIORIDADE (Regra de Negócio Crítica)
      const dataNascimento = new Date(birthDate);
      const hoje = new Date(); // Considera a data atual do sistema (2026)
      let idade = hoje.getFullYear() - dataNascimento.getFullYear();
      const mes = hoje.getMonth() - dataNascimento.getMonth();

      if (mes < 0 || (mes === 0 && hoje.getDate() < dataNascimento.getDate())) {
        idade--;
      }

      if (idade < 18) {
        return res.status(403).json({
          error:
            "Acesso negado: É necessário ter 18 anos ou mais para se cadastrar no AutoZoom.",
        });
      }

      // 2. VALIDAÇÃO DE E-MAIL (Critério: Back-end)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Formato de e-mail inválido." });
      }

      // 3. VALIDAÇÃO REAL DE CPF (Critério: Back-end)
      if (!validarCPF(cpf)) {
        return res.status(400).json({ error: "O CPF informado é inválido." });
      }
      const cpfLimpo = cpf.replace(/\D/g, "");

      // 4. VALIDAÇÃO DE NÍVEL DE SENHA (Critério: Tech Forge)
      const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
      if (!senhaRegex.test(password)) {
        return res.status(400).json({
          error:
            "A senha deve conter no mínimo 8 caracteres, incluindo letras, números e caracteres especiais.",
        });
      }

      // 5. VERIFICAÇÃO DE DUPLICIDADE
      const userExists = await User.findOne({ where: { email } });
      const cpfExists = await User.findOne({ where: { cpf: cpfLimpo } });

      if (userExists || cpfExists) {
        return res
          .status(409)
          .json({ error: "Usuário já cadastrado com este e-mail ou CPF." });
      }

      // 6. CRIAÇÃO DO REGISTRO
      const user = await User.create({
        name,
        email,
        password,
        cpf: cpfLimpo,
        birthDate,
        phone,
      });

      return res.status(201).json(user);
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      return res
        .status(500)
        .json({ error: "Erro interno no servidor ao processar o cadastro." });
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
  static async update(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userIdFromToken = req.userId; // Vem do token (quem está logado)
      const userIdFromUrl = req.params.id as string; // Vem da URL (quem ele quer editar)

      // 1. REGRA: Só pode editar o próprio usuário
      if (userIdFromToken !== userIdFromUrl) {
        return res.status(403).json({
          error: "Operação negada: Você só pode editar o seu próprio perfil.",
        });
      }

      const user = await User.findByPk(userIdFromUrl);
      if (!user) {
        return res.status(404).json({ error: "Utilizador não encontrado" });
      }

      // Desestruturamos apenas o que o front-end costuma enviar na edição
      const { name, phone, email } = req.body;

      // 2. REGRA: Garantir que todos os campos obrigatórios da edição estão presentes
      if (!name || !phone) {
        return res
          .status(400)
          .json({ error: "Nome e telefone são campos obrigatórios." });
      }

      // 3. REGRA: Não permitir que o usuário altere o e-mail
      // Se ele enviou um e-mail na requisição e for diferente do que está no banco, nós barramos!
      if (email && email !== user.email) {
        return res.status(403).json({
          error:
            "Operação negada: Não é permitido alterar o endereço de e-mail.",
        });
      }

      // Atualizamos de forma segura APENAS os campos permitidos (ignoramos o email e cpf)
      await user.update({
        name,
        phone,
      });

      return res.status(200).json({
        message: "Dados atualizados com sucesso!",
        user: { name: user.name, phone: user.phone, email: user.email }, // Devolvemos os dados seguros
      });
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
