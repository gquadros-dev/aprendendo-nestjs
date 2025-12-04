import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NfeTesteModule } from './nfe-teste/nfe-teste.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    NfeTesteModule,
  ],
})
export class AppModule {}
