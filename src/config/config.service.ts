import { Injectable } from '@nestjs/common';
import WebAppConfig from '../../config/WebAppConfig';
import JmzFybAppConfig from '../../config/JmzFybAppConfig';

@Injectable()
export class ConfigService {
  WebAppConfig() {
    return WebAppConfig;
  }
  getWeappConfig(weappName) {
    return {
      'jmz-fyb': JmzFybAppConfig,
    }[weappName];
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
