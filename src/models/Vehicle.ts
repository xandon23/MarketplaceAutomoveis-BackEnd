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
  declare location: string; // Ex: "Campo Mourão - PR"

  @Column({ type: DataType.STRING, allowNull: false })
  declare brand: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare model: string;

  // Substituímos o "year" único pelos dois anos distintos
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare manufactureYear: number; // Ano de fabricação

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare modelYear: number; // Ano do modelo

  // Novas colunas de mecânica
  @Column({ type: DataType.STRING, allowNull: false })
  declare engine: string; // Ex: "2.0 Turbo", "1.0", "V8"

  @Column({ type: DataType.STRING, allowNull: false })
  declare transmission: string; // Ex: "Manual", "Automático"

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare price: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare mileage: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string;

  @Column({
    type: DataType.STRING,
    defaultValue: "available", // Todo carro nasce disponível
  })
  declare status: string;

  // Coluna JSON para guardar a lista de itens da sua imagem
  @Column({
    type: DataType.TEXT, // Usamos TEXT para garantir compatibilidade total
    allowNull: true,
    get() {
      const rawValue = this.getDataValue("features");
      if (!rawValue) return []; // Se for nulo, retorna lista vazia
      // Se o banco retornar como string, nós transformamos em objeto/array
      return typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
    },
    set(val: string[]) {
      // Garante que a lista seja salva como uma string JSON no banco
      this.setDataValue("features", JSON.stringify(val));
    },
  })
  declare features: string[]; // Vai guardar: ["Airbag", "Alarme", "Freio ABS"]

  // --- RELACIONAMENTOS ---
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @HasMany(() => VehicleImage)
  declare images: VehicleImage[];

  // Um veículo pode receber várias propostas de compra
  @HasMany(() => Proposal, "targetVehicleId")
  declare receivedProposals: Proposal[];
}
