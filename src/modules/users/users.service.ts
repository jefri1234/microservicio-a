import { Injectable, InternalServerErrorException, NotFoundException, Scope } from '@nestjs/common';
import { User } from '../users/user.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable({ scope: Scope.DEFAULT })
export class UsersService {

    constructor(
        @InjectModel(User) private userRepository: typeof User,
    ) { }


    async getUserId(userId: string): Promise<User> {
        try {
            const user = await this.userRepository.findByPk(userId);
            if (!user) {
                throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
            }
            return user
        }
        catch (error) {
            console.error(`Error server al obtener el usuario con ID ${userId}:`, error);
            throw new InternalServerErrorException(`Error al obtener el usuario con ID ${userId}: ${error.message}`);
        }
    }

    async updateUser(userId: string, stripeCustomerId: string): Promise<any> {
        await this.userRepository.update(
            {
                stripe_customer_id: stripeCustomerId
            },
            {
                where: {
                    user_id: userId
                }
            }
        );
    }
}
