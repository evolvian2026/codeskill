import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { User } from './user.schema';
import { ProblemStatement } from './problem-statement.schema';
import { ProblemConfig } from './problem-config.schema';
import { ProblemTestCase } from './problem-testcase.schema';

export type ProblemMetadataDocument = HydratedDocument<ProblemMetadata>;

class ProblemMetadataStats {
  @Prop({ default: 0 })
  totalSubmissions: number;

  @Prop({ default: 0 })
  acceptedSubmissions: number;

  @Prop({ default: 0 })
  acceptanceRate: number;
}

@Schema({ timestamps: true })
export class ProblemMetadata {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, trim: true })
  slug: string;

  @Prop({ enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' })
  difficulty: string;

  @Prop([String])
  categories: string[];

  @Prop([String])
  tags: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  author: User | Types.ObjectId;

  @Prop({ enum: ['Draft', 'Published', 'Private'], default: 'Draft' })
  visibility: string;

  @Prop()
  metaTitle?: string;

  @Prop()
  metaDescription?: string;

  @Prop([String])
  keywords: string[];

  @Prop({ type: ProblemMetadataStats, default: () => ({}) })
  stats: ProblemMetadataStats;

  @Prop({ type: Types.ObjectId, ref: 'ProblemStatement' })
  statement: ProblemStatement | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProblemConfig' })
  config: ProblemConfig | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProblemTestCase' })
  testCases: ProblemTestCase | Types.ObjectId;
}

export const ProblemMetadataSchema =
  SchemaFactory.createForClass(ProblemMetadata);

ProblemMetadataSchema.index({ visibility: 1, createdAt: -1 });
ProblemMetadataSchema.index({ visibility: 1, difficulty: 1 });
ProblemMetadataSchema.index({ categories: 1 });
ProblemMetadataSchema.index({ tags: 1 });
