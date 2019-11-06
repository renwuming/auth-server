import {
  Controller,
  Get,
  Post,
  Query,
  HttpService,
  Response,
  Body,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.interface';
import { ConfigService } from '../config/config.service';
import { CacheService } from '../cache/cache.service';
import { getLoginUrlDto } from './dto/getLoginUrl.dto';
import { validateCodeDto } from './dto/validateCode.dto';
import { UserService } from './user.service';
import { validateTicketDto } from './dto/validateTicket.dto';

@Controller('user')
export class UserController {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService,
  ) {}

  @Get('/login/url')
  getLoginUrl(@Query() query: getLoginUrlDto) {
    const { redirect } = query;
    // 生成随机字符串
    const randomCode = this.configService.RandomKey();

    const { AppID } = this.configService.getAppConfig('web');

    const redirectUrl = `${this.configService.Host()}/user/login/validate?redirect=${redirect}`;
    // 将randomCode存入session，防止csrf攻击，有效期300s
    this.cacheService.set(randomCode, true, 300);
    const url = `https://open.weixin.qq.com/connect/qrconnect?appid=${AppID}&redirect_uri=${redirectUrl}&response_type=code&scope=snsapi_login&state=${randomCode}#wechat_redirect`;
    return url;
  }

  // 校验ticket，内部接口
  @Post('/validate_741236987')
  async validate(@Body() body: validateTicketDto) {
    const { ticket } = body;
    const unionid = this.cacheService.get(ticket);
    const user = await this.userModel.findOne({ unionid });
    if (user) {
      return user.toObject();
    } else {
      throw new UnprocessableEntityException('登录过期');
    }
  }
  // 退出登录，内部接口
  @Post('/logout_741236987')
  async logout(@Body() body: validateTicketDto) {
    const { ticket } = body;
    this.cacheService.set(ticket, null);
    return null;
  }

  @Get('/login/validate')
  async validateLogin(@Query() query: validateCodeDto, @Response() res) {
    const { code, state, redirect } = query;
    // 校验session，防止csrf攻击
    const session = this.cacheService.get(state);
    if (session) {
      const { AppID, AppSecret } = this.configService.getAppConfig('web');
      const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${AppID}&secret=${AppSecret}&code=${code}&grant_type=authorization_code`;
      const wxLoginData = await this.httpService
        .get(url)
        .toPromise()
        .then(res => res.data);
      const { access_token, unionid } = wxLoginData;
      if (access_token) {
        // 更新用户信息
        this.userService.updateUserData(wxLoginData);
        // 生成ticket，并将ticket与unionid关联，存入session
        const ticket = this.configService.RandomKey();
        this.cacheService.set(ticket, unionid);
        // 存入cookie
        res.cookie('ticket', ticket);
        res.redirect(redirect);
      } else {
        throw new UnprocessableEntityException('code失效');
      }
    } else {
      throw new UnprocessableEntityException('state失效，请重新登录');
    }
  }
}
