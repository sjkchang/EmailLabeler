import { Module } from '@nestjs/common';
import { RuleController } from './rule.controller';
import { UserModule } from 'src/user/user.module';
import { RuleService } from './rule.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Rule, RuleSchema } from '../schemas/rule.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    UserModule,
    HttpModule,
    MongooseModule.forFeature([{ name: Rule.name, schema: RuleSchema }]),
  ],
  controllers: [RuleController],
  providers: [RuleService],
  exports: [RuleService],
})
export class RuleModule {}
