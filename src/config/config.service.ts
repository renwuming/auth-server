import { Injectable } from '@nestjs/common';
import WebAppConfig from '../WebAppConfig';

@Injectable()
export class ConfigService {
  WebAppConfig() {
    return WebAppConfig;
  }
}
