import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  BeforeCreate,
  BeforeSave,
} from "sequelize-typescript";
import bcrypt from "bcryptjs";
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

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare cpf: string;

  @BeforeSave
  static async hashPassword(instance: User) {
    if (instance.changed("password")) {
      const salt = await bcrypt.genSalt(10);
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
