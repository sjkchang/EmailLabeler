import { HttpService } from '@nestjs/axios';
import { EmailService } from './email.service';
import { OpenAIService } from '../openai/openai.service';
import { RuleService } from '../rule/rule.service';
import { EmailClassificationRequest } from '../schemas/email.schema';
import { UserDocument } from '../schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { of, throwError } from 'rxjs';
import { InternalServerErrorException } from '@nestjs/common';
import * as axios from 'axios';

jest.mock('axios');

describe('EmailService', () => {
  let emailService: EmailService;
  let httpService: HttpService;
  let openAiService: OpenAIService;
  let rulesService: RuleService;
  let emailModel: Model<EmailClassificationRequest>;
  let user: UserDocument;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: getModelToken(EmailClassificationRequest.name),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            updateOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: OpenAIService,
          useValue: {
            chatGptRequest: jest.fn(),
          },
        },
        {
          provide: RuleService,
          useValue: {
            getMyRules: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    emailService = moduleRef.get<EmailService>(EmailService);
    httpService = moduleRef.get<HttpService>(HttpService);
    openAiService = moduleRef.get<OpenAIService>(OpenAIService);
    rulesService = moduleRef.get<RuleService>(RuleService);
    emailModel = moduleRef.get<Model<EmailClassificationRequest>>(
      getModelToken(EmailClassificationRequest.name),
    );
    user = {
      _id: new mongoose.Types.ObjectId(),
      googleOauthToken: 'token',
      lastFetchedEmailDatetime: new Date(),
      save: jest.fn(),
    } as any;
  });

  describe('categorizeEmail', () => {
    it('should categorize an email based on rules', async () => {
      const email = {
        _id: 'email_id',
        emailId: 'email_id',
        content: 'Email content',
        associated_labels: [],
        status: 'unprocessed',
        save: jest.fn().mockResolvedValue(true),
      } as any;

      jest.spyOn(rulesService, 'getMyRules').mockResolvedValue([
        { owner: user, prompt: 'Rule 1 Prompt', name: 'Rule1' },
        { owner: user, prompt: 'Rule 2 Prompt', name: 'Rule2' },
      ]);
      jest
        .spyOn(openAiService, 'chatGptRequest')
        .mockResolvedValue('Label1, Label2');

      await emailService.categorizeEmail(user, email);

      expect(rulesService.getMyRules).toHaveBeenCalledWith(user);
      expect(openAiService.chatGptRequest).toHaveBeenCalled();
      expect(email.associated_labels).toEqual(['Label1', 'Label2']);
      expect(email.status).toBe('categorized');
      expect(email.save).toHaveBeenCalled();
    });

    it('should handle errors during categorization', async () => {
      const email = {
        _id: 'email_id',
        emailId: 'email_id',
        content: 'Email content',
        associated_labels: [],
        status: 'unprocessed',
        save: jest.fn().mockResolvedValue(true),
      } as any;

      jest
        .spyOn(rulesService, 'getMyRules')
        .mockRejectedValue(new Error('Error fetching rules'));

      await emailService.categorizeEmail(user, email);

      expect(rulesService.getMyRules).toHaveBeenCalledWith(user);
      expect(email.associated_labels).toEqual([]);
      expect(email.status).toBe('unprocessed');
      expect(email.save).not.toHaveBeenCalled();
    });
  });

  describe('categorizeEmails', () => {
    it('should categorize all unprocessed emails', async () => {
      const emails = [
        {
          _id: 'email_id1',
          emailId: 'email_id1',
          content: 'Email content 1',
          associated_labels: [],
          status: 'unprocessed',
          save: jest.fn().mockResolvedValue(true),
        },
        {
          _id: 'email_id2',
          emailId: 'email_id2',
          content: 'Email content 2',
          associated_labels: [],
          status: 'unprocessed',
          save: jest.fn().mockResolvedValue(true),
        },
      ];

      jest.spyOn(emailModel, 'find').mockResolvedValue(emails);
      jest.spyOn(emailService, 'categorizeEmail').mockResolvedValue(undefined);

      await emailService.categorizeEmails(user);

      expect(emailModel.find).toHaveBeenCalledWith({
        owner: user._id,
        status: 'unprocessed',
      });
      expect(emailService.categorizeEmail).toHaveBeenCalledTimes(emails.length);
    });

    it('should handle errors during email categorization', async () => {
      const emails = [
        {
          _id: 'email_id1',
          emailId: 'email_id1',
          content: 'Email content 1',
          associated_labels: [],
          status: 'unprocessed',
          save: jest.fn().mockResolvedValue(true),
        },
      ];

      jest.spyOn(emailModel, 'find').mockResolvedValue(emails);
      jest
        .spyOn(emailService, 'categorizeEmail')
        .mockRejectedValue(new Error('Error categorizing email'));

      await emailService.categorizeEmails(user);

      expect(emailModel.find).toHaveBeenCalledWith({
        owner: user._id,
        status: 'unprocessed',
      });
      expect(emailService.categorizeEmail).toHaveBeenCalledTimes(emails.length);
    });
  });

  describe('getMyLabels', () => {
    it('should return labels for the user', async () => {
      const labels = [
        { id: 'label1', name: 'Label 1' },
        { id: 'label2', name: 'Label 2' },
      ];

      const response: axios.AxiosResponse<any> = {
        data: { labels },
        headers: {},
        config: {
          url: 'http://localhost:3000/mockUrl',
          headers: undefined,
        },
        status: 200,
        statusText: 'OK',
      };

      jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(response));

      const result = await emailService.getMyLabels(user);

      expect(httpService.get).toHaveBeenCalledWith(
        'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        { headers: { Authorization: `Bearer ${user.googleOauthToken}` } },
      );
      expect(result).toEqual([
        ['label1', 'Label 1'],
        ['label2', 'Label 2'],
      ]);
    });

    it('should handle errors when fetching labels', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          throwError(new Error('Error fetching labels')),
        );

      await expect(emailService.getMyLabels(user)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(httpService.get).toHaveBeenCalledWith(
        'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        { headers: { Authorization: `Bearer ${user.googleOauthToken}` } },
      );
    });
  });

  describe('createLabel', () => {
    it('should create a new label', async () => {
      const labelName = 'New Label';
      const response: axios.AxiosResponse<any> = {
        data: { id: 'new_label_id', name: labelName },
        headers: {},
        config: {
          url: 'http://localhost:3000/mockUrl',
          headers: undefined,
        },
        status: 200,
        statusText: 'OK',
      };

      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() => of(response));

      const result = await emailService.createLabel(user, labelName);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        {
          name: labelName,
          messageListVisibility: 'show',
          labelListVisibility: 'labelShow',
        },
        { headers: { Authorization: `Bearer ${user.googleOauthToken}` } },
      );
      expect(result).toEqual(['new_label_id', labelName]);
    });

    it('should handle errors when creating a label', async () => {
      const labelName = 'New Label';
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() =>
          throwError(new Error('Error creating label')),
        );

      await expect(emailService.createLabel(user, labelName)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(httpService.post).toHaveBeenCalledWith(
        'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        {
          name: labelName,
          messageListVisibility: 'show',
          labelListVisibility: 'labelShow',
        },
        { headers: { Authorization: `Bearer ${user.googleOauthToken}` } },
      );
    });
  });

  describe('fetchNewEmails', () => {
    it('should fetch new emails and save them', async () => {
      const messages = [{ id: 'email_id1', threadId: 'thread_id1' }];
      const response: axios.AxiosResponse<any> = {
        data: { messages },
        headers: {},
        config: {
          url: 'http://localhost:3000/mockUrl',
          headers: undefined,
        },
        status: 200,
        statusText: 'OK',
      };

      jest.spyOn(httpService, 'get').mockImplementationOnce(() => of(response));
    });

    it('should handle errors when fetching new emails', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          throwError(new Error('Error fetching emails')),
        );

      await expect(emailService.fetchNewEmails(user)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(httpService.get).toHaveBeenCalled();
    });
  });
});
