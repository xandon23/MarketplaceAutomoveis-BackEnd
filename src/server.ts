import sequelize from "./config/database";
import app from "./app";

const port = 3000;

sequelize.sync({ alter: true });

app.listen(port, () => {
  console.log(`Acesse http://localhost:${port}`);
});
