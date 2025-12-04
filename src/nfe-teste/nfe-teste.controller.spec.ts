import { Test, TestingModule } from '@nestjs/testing';
import { NfeTesteController } from './nfe-teste.controller';

describe('NfeTesteController', () => {
  let controller: NfeTesteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NfeTesteController],
    }).compile();

    controller = module.get<NfeTesteController>(NfeTesteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
