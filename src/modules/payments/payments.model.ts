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


@Table({ tableName: 'payments' })
export class Payment extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column({ type: DataType.UUID })
    id: string;

    @ForeignKey(() => User)
    @Column({ type: DataType.UUID, allowNull: false })
    user_id: string;

    // IDs de Stripe
    @Column({ type: DataType.STRING, unique: true })
    stripe_session_id: string;        

    @Column({ type: DataType.STRING, allowNull: true })
    stripe_payment_intent_id: string; 

    @Column({ type: DataType.STRING, allowNull: true })
    stripe_invoice_id: string;         

    @Column({ type: DataType.STRING, allowNull: true })
    stripe_subscription_id: string;    

    // Dinero
    @Column({ type: DataType.INTEGER, allowNull: true })
    amount: number;                    

    @Column({ type: DataType.STRING(3), allowNull: true })
    currency: string;                  

    // Estado del pago
    @Column({
        type: DataType.ENUM('pending', 'completed', 'failed', 'refunded', 'expired'),
        defaultValue: 'pending'
    })
    status: string;

    // Para debug cuando falla
    @Column({ type: DataType.TEXT, allowNull: true })
    failure_message: string;

    // El evento de Stripe que lo generó
    @Column({ type: DataType.STRING, allowNull: true })
    stripe_event_id: string;       

    @Column({ type: DataType.DATE, allowNull: true })
    paid_at: Date;

    @CreatedAt
    created_at: Date;

    @UpdatedAt
    updated_at: Date;
}