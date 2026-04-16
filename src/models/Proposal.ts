import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import User from "./User";
import Vehicle from "./Vehicle";

@Table({
  tableName: "proposals",
  timestamps: true,
})
export default class Proposal extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare cashOffer: number;

  @Column({
    type: DataType.ENUM("PENDING", "ACCEPTED", "REJECTED"),
    defaultValue: "PENDING",
    allowNull: false,
  })
  declare status: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare message: string;

  // --- RELACIONAMENTOS ---

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare buyerId: string;

  @BelongsTo(() => User, "buyerId")
  declare buyer: User;

  @ForeignKey(() => Vehicle)
  @Column({ type: DataType.UUID, allowNull: false })
  declare targetVehicleId: string;

  @BelongsTo(() => Vehicle, "targetVehicleId")
  declare targetVehicle: Vehicle;

  @ForeignKey(() => Vehicle)
  @Column({ type: DataType.UUID, allowNull: true })
  declare offeredVehicleId: string;

  @BelongsTo(() => Vehicle, "offeredVehicleId")
  declare offeredVehicle: Vehicle;

  @BelongsTo(() => Vehicle) vehicle!: Vehicle;
}
