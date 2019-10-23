import { Injectable } from '@nestjs/common';
import WebAppConfig from '../WebAppConfig';

@Injectable()
export class ConfigService {
  WebAppConfig() {
    return WebAppConfig;
  }
  Host() {
    // return 'http://www.renwuming.cn/auth'; // TODO
    return 'https://www.renwuming.cn/auth';
  }
  RandomKey() {
    return Math.random()
      .toString(36)
      .substr(2, 10);
  }
}
