import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources';

// Define a type for message objects
type Message = {
  text: string;
  ai?: boolean; // Indicate if the message is from the AI
};

@Injectable()
export class OpenAIService {
  constructor(private readonly openAI: OpenAI) {
    // Inject the OpenAI instance
    // Initialize OpenAI with the provided API key from the environment
    this.openAI = new OpenAI({
      apiKey: process.env.LLM_API_KEY,
    });
  }

  /**
   * Make a request to ChatGPT to generate a response based on a prompt and message history.
   * @param prompt - The prompt for the ChatGPT model
   * @param messages - An array of messages representing the conversation history
   * @returns A string containing the generated response
   */
  async chatGptRequest(prompt: string, messages: Message[]): Promise<string> {
    try {
      // Convert message history to the format expected by the OpenAI API
      const history = messages.map(
        (message): ChatCompletionMessageParam => ({
          role: message.ai ? 'assistant' : 'user',
          content: message.text,
        }),
      );

      // Make a request to the ChatGPT model
      const completion: ChatCompletion =
        await this.openAI.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: prompt,
            },
            ...history,
          ],
          temperature: 0.5,
          max_tokens: 1000,
        });

      // Extract the content from the response
      const [content] = completion.choices.map(
        (choice) => choice.message.content,
      );

      return content;
    } catch (e) {
      // Log and propagate the error
      console.error(e.headers);
      throw new ServiceUnavailableException('Failed request to ChatGPT');
    }
  }
}
