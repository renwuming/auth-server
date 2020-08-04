import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.interface';
import WXBizDataCrypt from './WXBizDataCrypt';

@Injectable()
export class WeappUserService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}
  // 根据ticket，获取用户信息
  async getUserData(data) {
    const { openid } = data;
    const userData = await this.userModel
      .findOne({
        openid,
      })
      .lean();
    return { ...userData, ...data };
  }

  // 解密用户数据，包括unionid等
  async getFullUserData(AppID, { session_key }, encryptedData, iv) {
    const pc = new WXBizDataCrypt(AppID, session_key);
    const data = pc.decryptData(encryptedData, iv);
    return data;
  }
}
