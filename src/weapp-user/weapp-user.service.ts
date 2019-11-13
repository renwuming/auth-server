import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.interface';

@Injectable()
export class WeappUserService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}
  // 根据ticket，获取用户信息
  async getUserData(data) {
    const { openid } = data;
    const userData = await this.userModel.findOne({
      openid,
    });
    return userData;
  }
}
