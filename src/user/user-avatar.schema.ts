import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserAvatarDocument = UserAvatar & Document;

@Schema()
export class UserAvatar {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  hash: string;

  //   @Prop({ required: true })
  //   imageBase64: string;
}

export const UserAvatarSchema = SchemaFactory.createForClass(UserAvatar);
