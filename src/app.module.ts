import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [AuthModule, UsersModule, BookingsModule, PaymentsModule, ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
