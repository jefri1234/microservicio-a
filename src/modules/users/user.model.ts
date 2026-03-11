import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    AllowNull,
    Unique,
} from "sequelize-typescript";

@Table({
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
})
export class User extends Model<User> {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column({
        type: DataType.UUID,
        allowNull: false,
        field: "user_id",
    })
    user_id: string;

    @Unique
    @AllowNull(false)
    @Column({
        type: DataType.STRING(255),
    })
    email: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(255),
    })
    password: string;

    @AllowNull(true)
    @Column({
        type: DataType.TEXT,
    })
    name: string;

    @Default(true)
    @AllowNull(false)
    @Column({
        type: DataType.BOOLEAN,
    })
    is_active: boolean;

    @Default(false)
    @AllowNull(false)
    @Column({
        type: DataType.BOOLEAN,
    })
    is_verified: boolean;

    @Default(DataType.NOW)
    @AllowNull(false)
    @Column({
        type: DataType.DATE,
    })
    created_at: Date;

    @Default(DataType.NOW)
    @AllowNull(false)
    @Column({
        type: DataType.DATE,
    })
    updated_at: Date;


    @Column({
        type: DataType.TEXT, 
        allowNull: true,
    })
    stripe_customer_id: string;
}
