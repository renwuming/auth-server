import { Module, HttpModule } from '@nestjs/common';
import { WeappUserController } from './weapp-user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../schemas/user.schema';
import { WeappUserService } from './weapp-user.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [WeappUserController],
  providers: [WeappUserService],
})
export class WeappUserModule {}
