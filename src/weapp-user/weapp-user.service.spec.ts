import { Test, TestingModule } from '@nestjs/testing';
import { WeappUserService } from './weapp-user.service';

describe('WeappUserService', () => {
  let service: WeappUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WeappUserService],
    }).compile();

    service = module.get<WeappUserService>(WeappUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
