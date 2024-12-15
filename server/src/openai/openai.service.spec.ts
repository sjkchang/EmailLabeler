import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIService } from './openai.service';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

describe('OpenAIService', () => {
  let service: OpenAIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        {
          provide: OpenAI,
          useFactory: () => {
            return new OpenAI({
              apiKey: process.env.LLM_API_KEY,
            });
          },
        },
      ],
      exports: [OpenAIService],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should make a real request to OpenAI API', async () => {
    const prompt = 'Hello, how are you?';
    const response = await service.chatGptRequest(prompt, []);
    expect(response).toBeDefined();
  });
});
