import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import Vehicle from "./Vehicle";

@Table({
  tableName: "vehicle_images",
  timestamps: true,
})
export default class VehicleImage extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  url!: string; // Aqui ficará salvo o caminho da imagem, ex: "/uploads/foto1.jpg"

  // Chave Estrangeira: A qual veículo esta foto pertence?
  @ForeignKey(() => Vehicle)
  @Column({ type: DataType.UUID, allowNull: false })
  vehicleId!: string;

  @BelongsTo(() => Vehicle)
  vehicle!: Vehicle;
}
