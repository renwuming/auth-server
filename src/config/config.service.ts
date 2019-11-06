import { Injectable } from '@nestjs/common';
import AppConfig from '../../AppConfig';

@Injectable()
export class ConfigService {
  getAppConfig(appName) {
    return AppConfig[appName];
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
