import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NfeTesteService } from './nfe-teste.service';
import { NfeTesteController } from './nfe-teste.controller';
import { NotaFiscal } from './entities/nfe.entity';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([NotaFiscal])
    ],
    controllers: [NfeTesteController],
    providers: [NfeTesteService],
    exports: [NfeTesteService],
})
export class NfeTesteModule {}
