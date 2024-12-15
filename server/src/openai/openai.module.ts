import { Global, Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import OpenAI from 'openai';

@Global()
@Module({
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
})
export class OpenAIModule {}
