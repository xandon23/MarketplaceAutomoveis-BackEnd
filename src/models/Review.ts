import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import User from "./User";

@Table({
  tableName: "reviews",
  timestamps: true,
})
export default class Review extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare rating: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare comment: string;

  // --- RELACIONAMENTOS ---

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare reviewerId: string;

  @BelongsTo(() => User, "reviewerId")
  declare reviewer: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare reviewedId: string;

  @BelongsTo(() => User, "reviewedId")
  declare reviewed: User;
}
