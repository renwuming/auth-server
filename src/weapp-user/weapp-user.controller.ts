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
  async validate(@Body() body) {
    const { ticket } = body;
    return this.getDataByTicket(ticket);
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

  @Post('/update-userinfo')
  async updateUserInfo(@Body() body, @Headers() headers) {
    const { userInfo, encryptedData, iv } = body;
    const ticket = headers['x-ticket'];
    const weappName = headers['x-weappname'];
    const config = this.configService.getAppConfig(weappName);
    const { AppID } = config;
    const userData = await this.getDataByTicket(ticket);
    const { unionId } = await this.weappUserService.getFullUserData(
      AppID,
      userData,
      encryptedData,
      iv,
    );
    await this.userModel.findOneAndUpdate(
      {
        openid: userData.openid,
      },
      {
        userInfo,
        authorized: true,
      },
    );
    if (unionId) {
      await this.userModel.findOneAndUpdate(
        {
          openid: userData.openid,
        },
        {
          unionid: unionId,
        },
      );
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
      nickName: `玩家${nickID}`,
      avatarUrl: defaultAvatarUrl,
    };
  }

  // 根据ticket获取用户信息
  async getDataByTicket(ticket) {
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
}
