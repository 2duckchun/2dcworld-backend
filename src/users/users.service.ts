import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersModel } from './entities/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersModel)
    private readonly usersRepository: Repository<UsersModel>,
  ) {}

  async findOneByGithubId(githubId: number) {
    const user = await this.usersRepository.findOne({
      where: {
        githubId: githubId,
      },
    });

    return user;
  }

  async createUser(
    user: Pick<
      UsersModel,
      'githubId' | 'loginId' | 'avatar' | 'nickname' | 'githubUrl'
    >,
  ) {
    const newUser = this.usersRepository.create(user);
    await this.usersRepository.save(newUser);
    return newUser;
  }
}
