import { Sequelize } from "sequelize-typescript";
import VehicleImage from "../../models/VehicleImage";
import Vehicle from "../../models/Vehicle";
import User from "../../models/User";

const sequelize = new Sequelize("marketplace_automoveis", "root", "", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
  logging: false,
  models: [User, Vehicle, VehicleImage],
});

export default sequelize;
