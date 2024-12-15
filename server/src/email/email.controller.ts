import { Controller, Get, Post } from '@nestjs/common';

import { CurrentUser } from 'src/user/user.decorator';
import { UserDocument } from 'src/schemas/user.schema';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('labels')
  async getMyLabels(@CurrentUser() user: UserDocument): Promise<any> {
    try {
      return this.emailService.getMyLabels(user);
    } catch (error) {
      console.error(error);
    }
  }

  @Post('label')
  async label(@CurrentUser() user: UserDocument): Promise<any> {
    try {
      await this.emailService.fetchNewEmails(user);
      console.log('Fetched new emails');
      await this.emailService.getFullEmailContents(user);
      console.log('Got full email contents');
      await this.emailService.categorizeEmails(user);
      console.log('Categorized emails');
      await this.emailService.labelEmails(user);
      return 'Emails labeled';
    } catch (error) {
      console.error(error);
    }
  }
}
