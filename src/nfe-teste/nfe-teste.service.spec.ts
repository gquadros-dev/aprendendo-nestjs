import { Test, TestingModule } from '@nestjs/testing';
import { NfeTesteService } from './nfe-teste.service';

describe('NfeTesteService', () => {
  let service: NfeTesteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NfeTesteService],
    }).compile();

    service = module.get<NfeTesteService>(NfeTesteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
