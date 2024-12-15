import { Test, TestingModule } from '@nestjs/testing';
import { RuleService } from './rule.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rule } from '../schemas/rule.schema';
import { CreateRuleDto } from './dto/create-rule.dto';
import { User, UserDocument } from 'src/schemas/user.schema';
import { ObjectId } from 'mongodb';

describe('RuleService', () => {
  let service: RuleService;
  let model: Model<Rule>;

  const mockRule = {
    _id: 'some_rule_id',
    name: 'Test Rule',
    prompt: 'A prompt for the test rule', // Updated to use `prompt` instead of `description`
    owner: 'user_sub',
  };

  const mockUser: UserDocument = {
    _id: new ObjectId(), // Creating a mock ObjectId
    sub: 'user_sub',
    email: 'test@example.com',
    given_name: 'Test',
    family_name: 'User',
    googleOauthToken: 'token',
    lastFetchedEmailDatetime: new Date(),
  } as UserDocument;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleService,
        {
          provide: getModelToken(Rule.name),
          useValue: {
            find: jest.fn().mockResolvedValue([mockRule]),
            findOneAndUpdate: jest.fn().mockResolvedValue(mockRule),
            findOneAndDelete: jest.fn().mockResolvedValue(mockRule),
            create: jest.fn().mockImplementation((createObj) => createObj),
          },
        },
      ],
    }).compile();

    service = module.get<RuleService>(RuleService);
    model = module.get<Model<Rule>>(getModelToken(Rule.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMyRules', () => {
    it('should return an array of rules', async () => {
      const result = await service.getMyRules(mockUser);
      expect(result).toEqual([mockRule]);
      expect(model.find).toHaveBeenCalledWith({ owner: mockUser._id });
    });
  });

  describe('createRule', () => {
    it('should create a new rule', async () => {
      const createRuleDto: CreateRuleDto = {
        name: 'New Rule',
        prompt: 'Prompt for new rule',
      };
      const result = await service.createRule(mockUser, createRuleDto);
      expect(result).toEqual(
        expect.objectContaining({
          ...createRuleDto,
          owner: mockUser._id,
        }),
      );
    });
  });

  describe('updateRule', () => {
    it('should update a rule', async () => {
      const createRuleDto: CreateRuleDto = {
        name: 'Updated Rule',
        prompt: 'Updated prompt',
      };
      const ruleId = 'some_rule_id';
      const result = await service.updateRule(mockUser, ruleId, createRuleDto);
      expect(result).toEqual(mockRule);
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: ruleId, user: mockUser._id },
        { ...createRuleDto },
        { new: true },
      );
    });
  });

  describe('deleteRule', () => {
    it('should delete a rule', async () => {
      const ruleId = 'some_rule_id';
      const result = await service.deleteRule(mockUser, ruleId);
      expect(result).toEqual(mockRule);
      expect(model.findOneAndDelete).toHaveBeenCalledWith({
        _id: ruleId,
        owner: mockUser._id,
      });
    });
  });

  describe('createRules', () => {
    it('should create multiple rules', async () => {
      const createRuleDtos: CreateRuleDto[] = [
        { name: 'Rule 1', prompt: 'Prompt 1' },
        { name: 'Rule 2', prompt: 'Prompt 2' },
      ];
      const result = await service.createRules(mockUser, createRuleDtos);
      expect(result).toEqual(
        createRuleDtos.map((dto) => ({ ...dto, user: mockUser._id })),
      );
      expect(model.create).toHaveBeenCalledWith(
        createRuleDtos.map((dto) => ({ ...dto, user: mockUser._id })),
      );
    });
  });
});
