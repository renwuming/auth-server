import {
  Controller,
  HttpService,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.interface';
import { ConfigService } from '../config/config.service';
import { CacheService } from '../cache/cache.service';
import { LoginDto } from './dto/Login.dto';
import WXBizDataCrypt from './WXBizDataCrypt';
import { WeappUserService } from './weapp-user.service';
const qs = require('querystring');

@Controller('weapp-user')
export class WeappUserController {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService,
    private readonly weappUserService: WeappUserService,
  ) {}

  @Post('/validate_741236987')
  async validate(@Headers() headers) {
    const ticket = headers['x-ticket'];
    if (ticket) {
      const user = this.cacheService.get(ticket);
      if (user) {
        return this.weappUserService.getUserData(user);
      } else {
        throw new UnauthorizedException('登录过期');
      }
    } else {
      throw new UnauthorizedException('登录过期');
    }
  }

  @Post('/login')
  async login(@Body() body: LoginDto, @Headers() headers) {
    const { code } = body;
    const weappName = headers['x-weappname'];
    const config = this.configService.getAppConfig(weappName);
    const { AppID, AppSecret } = config;

    const requestBody = {
      appid: AppID,
      secret: AppSecret,
      js_code: code,
      grant_type: 'authorization_code',
    };
    try {
      const result = await this.httpService
        .post(
          'https://api.weixin.qq.com/sns/jscode2session',
          qs.stringify(requestBody),
        )
        .toPromise()
        .then(res => res.data);
      if (!result.errcode) {
        const ticket = WXBizDataCrypt.randomKey();
        this.cacheService.set(ticket, result);
        this.updateUserData(result, weappName);
        return {
          ticket,
        };
      } else {
        throw new UnprocessableEntityException('登录失败');
      }
    } catch (error) {
      throw new UnprocessableEntityException('登录失败');
    }
  }

  // 根据openid等，更新用户信息
  async updateUserData(data, weappName) {
    const { openid } = data;
    const user = await this.userModel.findOne({
      openid,
    });
    if (!user) {
      const newUser = new this.userModel({
        openid,
        type: weappName,
        userInfo: this.createDefaultUserInfo(openid),
      });
      await newUser.save();
    }
  }

  // 生成默认userInfo
  createDefaultUserInfo(openid) {
    const defaultAvatarUrl = 'https://www.renwuming.cn/static/jmz/icon.jpg';
    const nickID = openid.substr(-4);
    return {
      nickname: `玩家${nickID}`,
      headimgurl: defaultAvatarUrl,
    };
  }
}
