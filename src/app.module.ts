import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
// import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [UserModule],
})
export class AppModule {}
