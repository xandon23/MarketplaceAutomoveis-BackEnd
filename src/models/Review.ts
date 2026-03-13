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

  // Nota de 1 a 5
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare rating: number;

  // Comentário sobre a negociação (opcional)
  @Column({ type: DataType.TEXT, allowNull: true })
  declare comment: string;

  // --- RELACIONAMENTOS ---

  // 1. Quem escreveu a avaliação? (Avaliador)
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare reviewerId: string;

  @BelongsTo(() => User, "reviewerId")
  declare reviewer: User;

  // 2. Quem está recebendo a nota? (Vendedor/Avaliado)
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare reviewedId: string;

  @BelongsTo(() => User, "reviewedId")
  declare reviewed: User;
}
