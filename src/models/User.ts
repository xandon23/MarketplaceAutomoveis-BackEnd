import {
  Table,
  Column,
  Model,
  DataType,
  IsEmail,
  Unique,
  BeforeSave,
  HasMany,
} from "sequelize-typescript";
import bcrypt from "bcrypt";
import Vehicle from "./Vehicle";

@Table({
  tableName: "users",
  timestamps: true, // Cria automaticamente as colunas createdAt e updatedAt
})
export default class User extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @IsEmail
  @Unique
  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "O e-mail não pode estar vazio.",
      },
    },
  })
  email!: string;

  @Unique
  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isCpfValid(value: string) {
        // Regex simples para garantir que o formato é um CPF válido (com ou sem pontuação)
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$|^\d{11}$/;
        if (!cpfRegex.test(value)) {
          throw new Error("O formato do CPF é inválido.");
        }
      },
    },
  })
  cpf!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isStrongPassword(value: string) {
        // Exigência da tabela: Validação de nível de senha
        // Mínimo de 8 caracteres, 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(value)) {
          throw new Error(
            "A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial.",
          );
        }
      },
    },
  })
  password!: string;

  // Hook (Gatilho) para criptografar a senha antes de guardar na base de dados
  @BeforeSave
  static async hashPassword(instance: User) {
    // Pegamos a senha bruta de forma segura usando o método nativo do Sequelize
    const rawPassword = instance.getDataValue("password");

    // Só criptografamos se a senha foi alterada/criada e se ela realmente existe
    if (instance.changed("password") && rawPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(rawPassword, salt);

      // Inserimos a senha criptografada de volta na instância de forma segura
      instance.setDataValue("password", hashedPassword);
    }
  }

  @HasMany(() => Vehicle)
  vehicles!: Vehicle[];
}
