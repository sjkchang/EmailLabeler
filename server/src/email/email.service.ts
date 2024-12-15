import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { User, UserDocument } from 'src/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import {
  EmailClassificationRequest,
  EmailClassificationRequestDocument,
} from '../schemas/email.schema';
import { Model } from 'mongoose';
import { format, sub } from 'date-fns'; // Utility for date formatting
import { OpenAIService } from '../openai/openai.service';
import { RuleService } from '../rule/rule.service';

@Injectable()
export class EmailService {
  constructor(
    @InjectModel(EmailClassificationRequest.name)
    private emailModel: Model<EmailClassificationRequest>,
    private readonly openAiService: OpenAIService,
    private readonly rulesService: RuleService,
    private readonly httpService: HttpService,
  ) {}

  async getMyLabels(user: UserDocument): Promise<[string, string][]> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          'https://gmail.googleapis.com/gmail/v1/users/me/labels',
          {
            headers: { Authorization: `Bearer ${user.googleOauthToken}` },
          },
        ),
      );
      return response.data.labels.map((label) => [label.id, label.name]);
    } catch (error) {
      console.error('Error fetching labels:', error.message);
      throw new InternalServerErrorException('Failed to fetch labels.');
    }
  }

  async createLabel(
    user: UserDocument,
    labelName: string,
  ): Promise<[string, string]> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          'https://gmail.googleapis.com/gmail/v1/users/me/labels',
          {
            name: labelName,
            messageListVisibility: 'show',
            labelListVisibility: 'labelShow',
          },
          {
            headers: { Authorization: `Bearer ${user.googleOauthToken}` },
          },
        ),
      );
      return [response.data.id, response.data.name];
    } catch (error) {
      console.error(`Error creating label "${labelName}":`, error.message);
      throw new InternalServerErrorException('Failed to create label.');
    }
  }

  async fetchNewEmails(
    user: UserDocument,
  ): Promise<EmailClassificationRequest[]> {
    const emails: any[] = [];
    let nextPageToken: string | undefined;

    try {
      const lastFetchedEmailDatetime =
        user.lastFetchedEmailDatetime || new Date(0);
      const formattedLastEmailDateTime = format(
        new Date(lastFetchedEmailDatetime),
        'MM/dd/yyyy',
      );
      const query = `after:${formattedLastEmailDateTime} in:inbox`;

      do {
        const response = await lastValueFrom(
          this.httpService.get(
            'https://gmail.googleapis.com/gmail/v1/users/me/messages',
            {
              headers: { Authorization: `Bearer ${user.googleOauthToken}` },
              params: { q: query, pageToken: nextPageToken, maxResults: 100 },
            },
          ),
        );

        const messages = response.data.messages || [];
        emails.push(...messages.map((message: any) => message));
        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken);

      user.lastFetchedEmailDatetime = new Date();
      await user.save();
    } catch (error) {
      console.error('Error fetching new emails:', error.message);
      throw new InternalServerErrorException('Failed to fetch new emails.');
    }

    try {
      const emailClassificationRequests = await Promise.all(
        emails.map((email) => {
          return new this.emailModel({
            owner: user._id,
            emailId: email.id,
            threadId: email.threadId,
            status: 'incomplete',
          }).save();
        }),
      );
      return emailClassificationRequests;
    } catch (error) {
      if (error.code === 11000) {
        console.log('Email already exists');
      } else {
        console.error(
          'Error saving email classification requests:',
          error.message,
        );
        throw new InternalServerErrorException('Failed to save email data.');
      }
    }
  }

  async getFullEmailContent(
    user: UserDocument,
    email: EmailClassificationRequestDocument,
  ): Promise<EmailClassificationRequestDocument> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.emailId}`,
          {
            headers: { Authorization: `Bearer ${user.googleOauthToken}` },
          },
        ),
      );

      const payload = response.data.payload;
      const subject = payload.headers.find(
        (header: any) => header.name === 'Subject',
      )?.value;

      let body = '';
      for (const part of payload.parts || []) {
        if (part.mimeType === 'text/plain') {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }

      if (body && subject) {
        email.content = `Subject: ${subject} Content: ${body}`;
        email.status = 'unprocessed';
        return email.save();
      }

      console.warn(`Missing email content for ID: ${email.emailId}`);
      return email;
    } catch (error) {
      console.error(
        `Error fetching content for email ID ${email.emailId}:`,
        error.message,
      );
      throw new InternalServerErrorException('Failed to fetch email content.');
    }
  }

  async getFullEmailContents(user: UserDocument): Promise<void> {
    // Get the incomplete emails from the database
    const unprocessedEmails = await this.emailModel.find({
      owner: user._id,
      status: 'incomplete',
    });

    for (const email of unprocessedEmails) {
      try {
        await this.getFullEmailContent(user, email);
      } catch (error) {
        console.error(
          `Error processing email with ID ${email.emailId}: ${error.message}`,
        );
      }
    }
  }

  async categorizeEmail(
    user: UserDocument,
    email: EmailClassificationRequestDocument,
  ) {
    try {
      const rules = await this.rulesService.getMyRules(user);

      let prompt = `You have been provided with the content of an email. Using the following list of rules
      and their associated labels, determine what labels, if any should be applied to this email. Your 
      response should come in the format of a comma-separated list of labels:
      If no labels apply, simply respond with "None".
      Rules:
      `;
      rules.forEach((rule) => {
        prompt += `- ${rule}\n`;
      });
      prompt += `Email Content: ${email.content}`;

      const messages = [];
      const gptResponse = await this.openAiService.chatGptRequest(
        prompt,
        messages,
      );

      const categorizedLabels = gptResponse
        .split(',')
        .map((label) => label.trim());

      email.associated_labels = [
        ...email.associated_labels,
        ...categorizedLabels,
      ];
      email.status = 'categorized';
      await email.save();
    } catch (error) {
      /*console.error(
        `Error categorizing email ID ${email.emailId}:`,
        error.message,
      );*/
    }
  }

  async categorizeEmails(user: UserDocument) {
    // Get the uncategorized emails from the database
    const uncategorizedEmails = await this.emailModel.find({
      owner: user._id,
      status: 'unprocessed',
    });

    for (const email of uncategorizedEmails) {
      try {
        await this.categorizeEmail(user, email);
      } catch (error) {
        /*
        console.error(
          `Error categorizing email with ID ${email.emailId}: ${error.message}`,
        );
        */
      }
    }
  }

  async labelEmails(user: UserDocument): Promise<EmailClassificationRequest[]> {
    let usersLabels = await this.getMyLabels(user);

    const categorizedEmails = await this.emailModel.find({
      owner: user._id,
      status: 'categorized',
    });

    for (const email of categorizedEmails) {
      try {
        const labelIds: string[] = [];

        for (const label of email.associated_labels) {
          try {
            let labelId = usersLabels.find(([id, name]) => name === label)?.[0];

            if (!labelId && label !== 'None') {
              const newLabel = await this.createLabel(user, label);
              usersLabels.push(newLabel);
              labelId = newLabel[0];
            }

            if (labelId) {
              labelIds.push(labelId);
            }
          } catch (error) {
            console.error(
              `Error creating or finding label "${label}" for email ID ${email.emailId}: ${error.message}`,
            );
          }
        }

        if (labelIds.length > 0) {
          try {
            await lastValueFrom(
              this.httpService.post(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.emailId}/modify`,
                {
                  addLabelIds: labelIds,
                },
                {
                  headers: { Authorization: `Bearer ${user.googleOauthToken}` },
                },
              ),
            );

            await this.emailModel.updateOne(
              { _id: email._id },
              { status: 'labeled' },
            );
          } catch (error) {
            console.error(
              `Error applying labels to email ID ${email.emailId}: ${error.message}`,
            );
          }
        } else {
          await this.emailModel.updateOne(
            { _id: email._id },
            { status: 'labeled' },
          );
        }
      } catch (error) {
        console.error(
          `Error processing labeled email with ID ${email.emailId}: ${error.message}`,
        );
      }
    }

    return categorizedEmails;
  }
}
