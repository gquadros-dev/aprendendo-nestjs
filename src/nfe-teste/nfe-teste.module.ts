import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NfeTesteService } from './nfe-teste.service';
import { NfeTesteController } from './nfe-teste.controller';

@Module({
    imports: [ConfigModule],
    controllers: [NfeTesteController],
    providers: [NfeTesteService],
    exports: [NfeTesteService],
})
export class NfeTesteModule {}
