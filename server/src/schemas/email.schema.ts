import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from './user.schema';
import { Label } from './label.schema';

export type EmailClassificationRequestDocument =
  HydratedDocument<EmailClassificationRequest>;

@Schema()
export class EmailClassificationRequest {
  @Prop({ required: true, unique: true })
  emailId: string;

  @Prop({ required: true, unique: true })
  threadId: string;

  @Prop()
  content: string;

  @Prop()
  associated_labels: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: User;

  @Prop({ required: true, default: 'incomplete' })
  status: string;
}

export const EmailClassificationRequestSchema = SchemaFactory.createForClass(
  EmailClassificationRequest,
);

// Middleware to deduplicate associated_labels
EmailClassificationRequestSchema.pre<EmailClassificationRequestDocument>(
  'save',
  function (next) {
    if (this.associated_labels) {
      // Remove duplicates
      this.associated_labels = Array.from(new Set(this.associated_labels));
    }
    next();
  },
);
