import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rule } from '../schemas/rule.schema';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UserDocument } from 'src/schemas/user.schema';

@Injectable()
export class RuleService {
  constructor(@InjectModel(Rule.name) private ruleModel: Model<Rule>) {}

  async getMyRules(user: UserDocument): Promise<Rule[]> {
    return this.ruleModel.find({ owner: user._id });
  }

  async createRule(
    user: UserDocument,
    createRuleDto: CreateRuleDto,
  ): Promise<Rule> {
    return this.ruleModel.create({ ...createRuleDto, owner: user._id });
  }

  async updateRule(
    user: UserDocument,
    ruleId: string,
    CreateRuleDto: CreateRuleDto,
  ): Promise<Rule> {
    return this.ruleModel.findOneAndUpdate(
      { _id: ruleId, user: user._id },
      { ...CreateRuleDto },
      { new: true },
    );
  }

  async createRules(
    user: UserDocument,
    createRuleDtos: CreateRuleDto[],
  ): Promise<Rule[]> {
    return this.ruleModel.create(
      createRuleDtos.map((ruleDto) => ({ ...ruleDto, user: user._id })),
    );
  }

  async deleteRule(user: UserDocument, ruleId: string): Promise<Rule> {
    return this.ruleModel.findOneAndDelete({
      _id: ruleId,
      owner: user._id,
    });
  }
}
