import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import User from "./User";
import VehicleImage from "./VehicleImage";
import Proposal from "./Proposal";

@Table({
  tableName: "vehicles",
  timestamps: true,
})
export default class Vehicle extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare location: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare brand: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare model: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare manufactureYear: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare modelYear: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare engine: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare transmission: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare mileage: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string;

  @Column({
    type: DataType.STRING,
    defaultValue: "available",
  })
  declare status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue("features");
      if (!rawValue) return [];
      return typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
    },
    set(val: string[]) {
      this.setDataValue("features", JSON.stringify(val));
    },
  })
  declare features: string[];

  // --- RELACIONAMENTOS ---
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare buyerId: string;

  @BelongsTo(() => User, { foreignKey: "buyerId", as: "Buyer" })
  declare Buyer: User;

  @BelongsTo(() => User)
  declare user: User;

  @HasMany(() => VehicleImage)
  declare images: VehicleImage[];

  @HasMany(() => Proposal, "targetVehicleId")
  declare receivedProposals: Proposal[];
}
