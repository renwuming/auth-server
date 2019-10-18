import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should set and get without error', async () => {
    const key = Math.random().toString();
    const value = 'renwuming';
    service.set(key, value, 1);
    // 1s内，该key可以得到预期的value
    expect(service.get(key)).toBe(value);
    const result = await new Promise(resolve => {
      setTimeout(() => {
        const result = service.get(key);
        resolve(result);
      }, 3 * 1000);
    });
    // 3s后，该key应该已失效
    expect(result).toBe(undefined);
  });
});
