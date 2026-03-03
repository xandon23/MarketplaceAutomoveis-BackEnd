import { Sequelize } from "sequelize";

const sequelize = new Sequelize("marketplace_automoveis", "root", "", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
  logging: false,
});

export default sequelize;
