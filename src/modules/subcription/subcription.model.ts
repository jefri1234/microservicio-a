import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    ForeignKey,
    CreatedAt,
    UpdatedAt
} from "sequelize-typescript";
import { User } from "../users/user.model";


// ¿Qué plan tiene el usuario HOY? ¿Está activo o cancelado?
@Table({ tableName: 'subscriptions' })
export class Subscription extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column({ type: DataType.UUID })
    id: string;

    // Tu sistema
    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, allowNull: false })
    user_id: string;

    // IDs de Stripe para rastrear
    @Column({ type: DataType.STRING, allowNull: false, unique: true })
    stripe_subscription_id: string;    // sub_xxxxx

    @Column({ type: DataType.STRING, allowNull: true })
    stripe_price_id: string;           // price_xxxxx — qué plan tiene

    // Estado — lo que más vas a consultar
    @Column({
        type: DataType.ENUM('active', 'canceled', 'past_due', 'trialing', 'unpaid', 'incomplete'),
        defaultValue: 'incomplete'
    })
    status: string;

    // Fechas críticas
    @Column({ type: DataType.DATE, allowNull: true })
    current_period_start: Date;        // Cuándo empezó el período actual

    @Column({ type: DataType.DATE, allowNull: true })
    current_period_end: Date;          // Cuándo vence — para saber si expiró

    @Column({ type: DataType.DATE, allowNull: true })
    canceled_at: Date;                 // Cuándo canceló

    @Column({ type: DataType.DATE, allowNull: true })
    trial_end: Date;                   // Si tiene período de prueba

    @CreatedAt
    created_at: Date;

    @UpdatedAt
    updated_at: Date;
}