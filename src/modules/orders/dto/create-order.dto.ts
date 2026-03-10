import {
    IsString,
    IsArray,
    ValidateNested,
    ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {

    @IsString()
    idempotencyKey: string;

    @IsString()
    userId: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsString()
    currency: string;
}