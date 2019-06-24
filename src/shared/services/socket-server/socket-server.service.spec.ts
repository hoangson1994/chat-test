import { Test, TestingModule } from '@nestjs/testing';
import { SocketServerService } from './socket-server.service';

describe('SocketServerService', () => {
  let service: SocketServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocketServerService],
    }).compile();

    service = module.get<SocketServerService>(SocketServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
