import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../schemas/user.schema';
import { HttpModule } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot('mongodb://localhost/wumingserver'),
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
        HttpModule,
      ],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should update without error', async () => {
    const data = {
      access_token:
        '26_RdWxm12IC-s32weT8EnZcXDgSd9tFvS149uLeVFzUMbML_2Pwdaw8Gvj5dSuEU8uojGd6fnuv2eosRf5sNeJzsEBTR2otcsXPRgNQpEglkE',
      refresh_token:
        '26_eAXWhTWHBrnwWEbQLsJ5BnDYT_vtzhxIgvFSMCrrmqZFhDJmocYCVI7xFEyfvYIMyVQyOm8fEb0GFFBejtY_Ovm3XsUTcowDkTIpT0xRV9A',
      openid: 'oK77A54Df6idoWr0nKI6HMRtLRms',
      unionid: 'oeWJz1hwC7guxd-1lb__8n5g9BrU',
    };
    await service.updateUserData(data);
  });
});
