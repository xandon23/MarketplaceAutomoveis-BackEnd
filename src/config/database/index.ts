import { Sequelize } from "sequelize-typescript";

const sequelize = new Sequelize("marketplace_automoveis", "root", "", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
  logging: false,
  models: [__dirname + "/../../models/**/*.ts"],
});

export default sequelize;
