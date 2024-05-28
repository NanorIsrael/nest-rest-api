import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Model } from 'mongoose';

import { User } from './user.schema';
import { senToQueue } from '../common/queue-service';
import { CreateUserDto } from './user-dto';
import { UserAvatar, UserAvatarDocument } from './user-avatar.schema';

@Injectable()
export class UserService {
  private readonly avatarDirectory = path.join(__dirname, '..', 'avatars');

  constructor(
    private httpService: HttpService,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel(UserAvatar.name)
    private userAvatarModel: Model<UserAvatarDocument>,
  ) {
    if (!fs.existsSync(this.avatarDirectory)) {
      fs.mkdirSync(this.avatarDirectory);
    }
  }

  async createUser(user: CreateUserDto): Promise<User | null> {
    const response = await lastValueFrom(
      this.httpService
        .post('https://reqres.in/api/users', user)
        .pipe(map((res) => res.data)),
    );

    if (response && response.id) {
      const newUser = new this.userModel({
        id: parseInt(response.id),
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
      });

      await newUser.save();
      await senToQueue<{ userEmail: string }>({ userEmail: user.email });

      return newUser;
    }
  }

  async getUser(id: number): Promise<any> {
    const res = await lastValueFrom(
      this.httpService
        .get(`https://reqres.in/api/users/${id}`)
        .pipe(map((response) => response.data)),
    );
    return res.data;
  }

  async getUserAvatar(userId: number): Promise<string> {
    try {
      const existingAvatar = await this.userAvatarModel.findOne({ userId });

      if (!existingAvatar) {
        const user: User = await this.userModel.findOne({ id: userId });

        if (user) {
          const response = await axios.get(user.avatar, {
            responseType: 'arraybuffer',
          });

          const buffer = Buffer.from(response.data);
          const imageBase64 = buffer.toString('base64');
          const hash = crypto
            .createHash('sha256')
            .update(imageBase64)
            .digest('hex');

          const newAvatar = new this.userAvatarModel({
            userId,
            hash,
          });

          console.log('Saving new avatar...');
          const fileName = `${userId}-${hash}.png`;
          const filePath = path.join(this.avatarDirectory, fileName);
          try {
            fs.writeFileSync(filePath, buffer);
            console.log('Saving completed', filePath);
          } catch (error) {
            console.error('Error writing file:', error);
          }

          await newAvatar.save();
          return imageBase64;
        } else {
          console.log('User not found');
          return 'User not found';
        }
      } else {
        const filePath = path.join(
          this.avatarDirectory,
          `${userId}-${existingAvatar.hash}.png`,
        );

        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          return buffer.toString('base64');
        } else {
          return 'Avatar file not found';
        }
      }
    } catch (error) {
      console.error('Error fetching user avatar:', error);
      return 'Error fetching user avatar';
    }
  }

  async deleteUserAvatar(id: number): Promise<number | null> {
    const avatarUser = await this.userAvatarModel
      .findOne({ userId: id })
      .exec();
    if (!avatarUser) {
      return null;
    }

    const filePath = path.join(
      this.avatarDirectory,
      `${id}-${avatarUser.hash}.png`,
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await this.userAvatarModel.deleteMany({ userId: id });
    return id;
  }
}
