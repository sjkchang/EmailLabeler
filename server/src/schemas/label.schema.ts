import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from './user.schema';

export type LabelDocument = HydratedDocument<Label>;

@Schema()
export class Label {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ default: '#000000' })
  color: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: User;
}

export const LabelSchema = SchemaFactory.createForClass(Label);
