
import { IsNotEmpty, IsString } from "class-validator";

export class CreatePaymentDto {
    @IsString()
    @IsNotEmpty()
    priceId: string;

    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    email: string;
}