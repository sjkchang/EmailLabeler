import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  sub: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  given_name: string;

  @Prop({ required: true })
  family_name: string;

  @Prop()
  lastFetchedEmailDatetime: Date;

  @Prop({ required: true })
  googleOauthToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
