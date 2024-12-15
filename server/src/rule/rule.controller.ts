import { Controller, Delete, Get, Post, Body, Param } from '@nestjs/common';
import { CurrentUser } from '../user/user.decorator';
import { User, UserDocument } from 'src/schemas/user.schema';
import { CreateRuleDto } from './dto/create-rule.dto';
import { RuleService } from './rule.service';

@Controller('rule')
export class RuleController {
  constructor(private readonly ruleService: RuleService) {}

  @Get()
  async getMyRules(@CurrentUser() user: UserDocument) {
    const results = await this.ruleService.getMyRules(user);
    console.log(results);
    return results;
  }

  @Post(':ruleId')
  updateRule(
    @CurrentUser() user: UserDocument,
    @Body() createRuleDto: CreateRuleDto,
    @Param('ruleId') id: string,
  ) {
    return { user, createRuleDto };
  }

  @Post()
  createRule(
    @CurrentUser() user: UserDocument,
    @Body() createRuleDto: CreateRuleDto,
  ) {
    return this.ruleService.createRule(user, createRuleDto);
  }

  @Post()
  createRules(
    @CurrentUser() user: UserDocument,
    @Body() createRuleDto: CreateRuleDto[],
  ) {
    return { user, createRuleDto };
  }

  @Delete(':ruleId')
  async deleteRule(
    @CurrentUser() user: UserDocument,
    @Param('ruleId') id: string,
  ) {
    console.log('Deleting rule with id: ', id);
    return await this.ruleService.deleteRule(user, id);
  }
}
