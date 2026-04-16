import sequelize from "./config/database";
import app from "./app";

const port = 3333;

sequelize
  .sync()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${port}`);
      console.log(`📡 Banco de dados sincronizado!`);
    });
  })
  .catch((error) => {
    console.error("❌ Erro ao conectar com o banco de dados:", error);
  });
