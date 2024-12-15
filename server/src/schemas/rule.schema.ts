import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from './user.schema';

export type RuleDocument = HydratedDocument<Rule>;

@Schema()
export class Rule {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  prompt: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: User;
}

export const RuleSchema = SchemaFactory.createForClass(Rule);
