import { Injectable } from '@nestjs/common';
const cache = require('node-cache');

@Injectable()
export class CacheService {
  constructor() {}
  private cacheInstance: any;

  // 获取实例
  getInstance() {
    if (this.cacheInstance) return this.cacheInstance;
    else {
      this.cacheInstance = new cache();
      return this.cacheInstance;
    }
  }

  set(key: string, value, ttl?: number) {
    const instance = this.getInstance();
    instance.set(key, value);
    if (ttl) {
      // 设置有效期
      instance.ttl(key, ttl);
    }
  }

  get(key: string) {
    const instance = this.getInstance();
    return instance.get(key);
  }
}
