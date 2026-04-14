import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  BeforeCreate,
  BeforeSave,
} from "sequelize-typescript";
import bcrypt from "bcryptjs"; // <-- Importamos o mestre da criptografia
import Vehicle from "./Vehicle";
import Proposal from "./Proposal";
import Review from "./Review";

@Table({
  tableName: "users",
  timestamps: true,
})
export default class User extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare password: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare phone: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare birthDate: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true }) // Garante que o banco nunca aceite dois CPFs iguais
  declare cpf: string;

  // --- O "PEDÁGIO" DE SEGURANÇA (HOOK) ---
  @BeforeSave // Executa antes de Criar (POST) e antes de Atualizar (PUT)
  static async hashPassword(instance: User) {
    // Só criptografa se a senha foi alterada ou é nova
    if (instance.changed("password")) {
      const salt = await bcrypt.genSalt(10); // Gera um "tempero" aleatório para a senha
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  // --- RELACIONAMENTOS ---
  @HasMany(() => Vehicle)
  declare vehicles: Vehicle[];

  @HasMany(() => Proposal, "buyerId")
  declare proposals: Proposal[];

  @HasMany(() => Review, "reviewerId")
  declare givenReviews: Review[];

  @HasMany(() => Review, "reviewedId")
  declare receivedReviews: Review[];
}
