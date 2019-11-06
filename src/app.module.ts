import { Module, Global, HttpModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { ConfigModule } from './config/config.module';
import { CacheModule } from './cache/cache.module';

@Global()
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/wumingserver'),
    UserModule,
    ConfigModule,
    CacheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
