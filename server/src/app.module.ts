import { Module, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { RuleModule } from './rule/rule.module';
import { UserServiceMiddleware } from './user/user.service';
import { EmailModule } from './email/email.module';
import { OpenAIModule } from './openai/openai.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    UserModule,
    RuleModule,
    EmailModule,
    OpenAIModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserServiceMiddleware).forRoutes('*');
  }
}
