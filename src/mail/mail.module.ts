import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  
  providers: [MailService],
  exports: [MailService], // Export so other modules can use it
})
export class MailModule {}