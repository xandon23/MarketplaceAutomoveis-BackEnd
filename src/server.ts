import sequelize from "./config/database";
import app from "./app";

// Mudamos para 3333 para não bater com o React (3000)
const port = 3333;

// Sincroniza o banco e só depois inicia o servidor
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
