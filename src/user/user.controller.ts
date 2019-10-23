import {
  Controller,
  Get,
  Post,
  Query,
  HttpService,
  Response,
  Body,
  BadRequestException,
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
    const { redirect } = query;
    // 生成随机字符串
    const randomCode = this.configService.RandomKey();

    const { AppID } = this.configService.WebAppConfig();

    const redirectUrl = `${this.configService.Host()}/user/login/validate?redirect=${redirect}`;
    // 将randomCode存入session，防止csrf攻击，有效期300s
    this.cacheService.set(randomCode, true, 300);
    const url = `https://open.weixin.qq.com/connect/qrconnect?appid=${AppID}&redirect_uri=${redirectUrl}&response_type=code&scope=snsapi_login&state=${randomCode}#wechat_redirect`;
    return url;
  }

  // 校验cookie，内部接口
  @Post('/validate_741236987')
  async validate(@Body() body) {
    const { ticket } = body;
    if (ticket) {
      const unionid = this.cacheService.get(ticket);
      const user = await this.userModel.findOne({ unionid });
      if (user) {
        return user.toObject();
      } else {
        throw new BadRequestException('登录过期');
      }
    } else {
      throw new BadRequestException('缺少ticket参数');
    }
  }
  // 退出登录，内部接口
  @Post('/logout_741236987')
  async logout(@Body() body) {
    const { ticket } = body;
    if (ticket) {
      this.cacheService.set(ticket, null);
      return null;
    }
  }

  @Get('/login/validate')
  async validateLogin(@Query() query: validateCodeDto, @Response() res) {
    const { code, state, redirect } = query;
    // 校验session，防止csrf攻击
    const session = this.cacheService.get(state);
    if (session && code) {
      const { AppID, AppSecret } = this.configService.WebAppConfig();
      const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${AppID}&secret=${AppSecret}&code=${code}&grant_type=authorization_code`;
      const wxLoginData = await this.httpService
        .get(url)
        .toPromise()
        .then(res => res.data);
      const { access_token, unionid } = wxLoginData;
      if (access_token) {
        // 更新用户信息
        this.updateUserData(wxLoginData);
        // 生成ticket，并将ticket与unionid关联，存入session
        const ticket = this.configService.RandomKey();
        this.cacheService.set(ticket, unionid);
        // 存入cookie
        res.cookie('ticket', ticket);
        res.redirect(redirect);
      } else {
        throw new BadRequestException('code失效');
      }
    } else {
      throw new BadRequestException('state失效，请重新登录');
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
