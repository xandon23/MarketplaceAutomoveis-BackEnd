import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Precisamos estender a interface do Express para o TypeScript aceitar o userId no 'req'
export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  // 1. Verificar se o header de autorização existe
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  // O formato do header é: "Bearer <TOKEN>"
  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({ error: "Erro no formato do token." });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: "Token malformatado." });
  }

  // 2. Validar o Token
  jwt.verify(token, "SuaChaveSecretaSuperDificil123", (err, decoded: any) => {
    if (err)
      return res.status(401).json({ error: "Token inválido ou expirado." });

    // 3. Se estiver tudo OK, injetamos o ID do usuário na requisição para uso futuro
    req.userId = decoded.id;

    // Deixa o usuário passar para a rota
    return next();
  });
};
