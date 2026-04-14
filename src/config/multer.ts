import multer from "multer";
import path from "path";
import crypto from "crypto";

export const multerConfig = {
  // Onde as fotos vão morar (crie a pasta 'uploads' na raiz do projeto)
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.resolve(__dirname, "..", "..", "uploads"));
    },
    filename: (req, file, cb) => {
      // Gera 8 caracteres aleatórios + nome original para evitar duplicidade
      const hash = crypto.randomBytes(8).toString("hex");
      const fileName = `${hash}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
  // Filtro de Segurança: Só aceita imagens
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = [
      "image/jpeg",
      "image/pjpeg",
      "image/png",
      "image/webp",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo inválido. Use apenas JPG, PNG ou WEBP."));
    }
  },
};
