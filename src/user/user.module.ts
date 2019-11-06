import { Module, HttpModule } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserSchema } from '../schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
