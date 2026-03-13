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
  declare cashOffer: number; // Valor em dinheiro oferecido

  @Column({
    type: DataType.ENUM("Pendente", "Aceita", "Recusada"),
    defaultValue: "Pendente",
    allowNull: false,
  })
  declare status: string; // O vendedor vai poder mudar isso depois

  @Column({ type: DataType.TEXT, allowNull: true })
  declare message: string; // Mensagem para o vendedor (ex: "Pago à vista se fechar hoje")

  // --- RELACIONAMENTOS ---

  // 1. Quem é o Comprador? (Chave Estrangeira para User)
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare buyerId: string;

  @BelongsTo(() => User, "buyerId")
  declare buyer: User;

  // 2. Qual carro ele quer comprar? (Chave Estrangeira para Vehicle)
  @ForeignKey(() => Vehicle)
  @Column({ type: DataType.UUID, allowNull: false })
  declare targetVehicleId: string;

  @BelongsTo(() => Vehicle, "targetVehicleId")
  declare targetVehicle: Vehicle;

  // 3. Ele vai dar um carro na troca? (Chave Estrangeira Opcional para Vehicle)
  @ForeignKey(() => Vehicle)
  @Column({ type: DataType.UUID, allowNull: true })
  declare offeredVehicleId: string;

  @BelongsTo(() => Vehicle, "offeredVehicleId")
  declare offeredVehicle: Vehicle;
}
