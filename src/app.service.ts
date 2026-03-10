import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getUsers(): object {
    return {
      users: [
        {
          id: 1,
          name: 'User 1',
          email: 'user1@gmail.com',
        },
        {
          id: 2,
          name: 'User 2',
          email: 'user2@gmail.com',
        },
      ],
    };
  }
}
