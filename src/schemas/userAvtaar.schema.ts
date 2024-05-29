import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserAvtaarDocument = HydratedDocument<UserAvtaar>;

@Schema()
export class UserAvtaar {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  avatar: string;
}

export const UserAvtaarSchema = SchemaFactory.createForClass(UserAvtaar);
