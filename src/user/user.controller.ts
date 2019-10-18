import {
  Controller,
  Get,
  Post,
  Query,
  HttpService,
  Response,
  Body,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.interface';
import { ConfigService } from '../config/config.service';
import { CacheService } from '../cache/cache.service';
import { getLoginUrlDto } from './dto/getLoginUrl.dto';
import { validateCodeDto } from './dto/validateCode.dto';

@Controller('user')
export class UserController {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('/login/url')
  getLoginUrl(@Query() query: getLoginUrlDto) {
    const { redirect, randomCode } = query;
    const { AppID } = this.configService.WebAppConfig();
    // 将randomCode存入session，防止csrf攻击
    this.cacheService.set(randomCode, true, 30);
    const url = `https://open.weixin.qq.com/connect/qrconnect?appid=${AppID}&redirect_uri=${redirect}&response_type=code&scope=snsapi_login&state=${randomCode}#wechat_redirect`;
    return url;
  }

  @Post('/login/validate')
  async validateCode(@Body() body: validateCodeDto, @Response() res) {
    const { code, state } = body;
    // 校验session，防止csrf攻击
    const session = this.cacheService.get(state);
    if (session && code) {
      const { AppID, AppSecret } = this.configService.WebAppConfig();
      const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${AppID}&secret=${AppSecret}&code=${code}&grant_type=authorization_code`;
      const wxLoginData = await this.httpService
        .get(url)
        .toPromise()
        .then(res => res.data);
      const { access_token } = wxLoginData;
      if (access_token) {
        // 将access_token保存到cookie，有效期7000s
        res.cookie('access_token', access_token, {
          maxAge: 7000 * 1000,
          httpOnly: true,
        });
        res.json();
        // 更新用户信息
        this.updateUserData(wxLoginData);
      } else {
        throw new Error('登录失败');
      }
    } else {
      throw new Error('登录失败');
    }
  }

  // 根据access_token、openid等，更新用户信息
  async updateUserData(wxLoginData) {
    const { access_token, openid, unionid } = wxLoginData;
    const user = await this.userModel.findOne({ unionid });
    const userInfo = await this.getUserInfo(access_token, openid);
    const insertData = Object.assign({}, wxLoginData, { userInfo });
    if (user) {
      await this.userModel.findOneAndUpdate(
        {
          unionid,
        },
        insertData,
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
}
