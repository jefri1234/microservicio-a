import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
} from "sequelize-typescript";

@Table({ tableName: 'stripe_events' })
export class StripeEvent extends Model {
    @PrimaryKey
    @Column({ type: DataType.STRING })
    event_id: string;

    @Column({ type: DataType.STRING })
    event_type: string;

    @Column({ type: DataType.DATE })
    processed_at: Date;
}