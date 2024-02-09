import { BaseModel } from 'src/common/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class UsersModel extends BaseModel {
  @Column({
    unique: true,
    nullable: false,
  })
  githubId: number;

  @Column({
    unique: true,
    nullable: false,
  })
  loginId: string;

  @Column()
  avatar: string;

  @Column({
    nullable: false,
  })
  nickname: string;

  @Column()
  githubUrl: string;
}
