import { Injectable, HttpService } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.interface';
const _ = require('lodash');

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly httpService: HttpService,
  ) {}

  // 根据access_token、openid等，更新用户信息
  async updateUserData(data) {
    const { access_token, openid } = data;
    const user = await this.userModel.findOne({ openid });
    const userInfo = await this.getUserInfo(access_token, openid);
    const insertData = _.merge(
      {},
      data,
      { userInfo },
      {
        type: 'web',
      },
    );
    if (user) {
      await this.userModel.findOneAndUpdate(
        {
          openid,
        },
        _.merge(user, insertData),
      );
    } else {
      const newUser = new this.userModel(insertData);
      await newUser.save();
    }
  }
  // 获取UserInfo
  async getUserInfo(access_token, openid) {
    const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;
    const data = await this.httpService
      .get(url)
      .toPromise()
      .then(res => res.data);
    delete data.openid;
    delete data.unionid;
    return data;
  }

  userInfoPolyfill(data) {
    const { nickname, headimgurl, sex } = data;
    if (nickname) data.nickName = nickname;
    if (headimgurl) data.avatarUrl = headimgurl;
    if (sex) data.gender = sex;
    return data;
  }
}
