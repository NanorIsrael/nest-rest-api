import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import {
  MongooseModule,
  getConnectionToken,
  getModelToken,
} from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { Model, Connection } from 'mongoose';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Observable, of } from 'rxjs';
import axios, { AxiosResponse } from 'axios';
import { senToQueue } from '../common/queue-service';
import { UserAvatar, UserAvatarSchema } from './user-avatar.schema';
import * as fs from 'fs';
import * as crypto from 'crypto';

jest.mock('../common/queue-service', () => ({
  senToQueue: jest.fn(),
}));
jest.mock('fs');
jest.mock('axios');

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<User>;
  let userAvatarModel: Model<UserAvatar>;
  let httpService: HttpService;
  let testUser: Partial<User>;
  let connection: Connection;

  beforeEach(async () => {
    testUser = {
      id: 1,
      email: 'george.bluth@reqres.in',
      first_name: 'George',
      last_name: 'Bluth',
      avatar: 'https://reqres.in/img/faces/1-image.jpg',
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        MongooseModule.forRoot('mongodb://localhost/nest'),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([
          { name: UserAvatar.name, schema: UserAvatarSchema },
        ]),
      ],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    userAvatarModel = module.get<Model<UserAvatar>>(
      getModelToken(UserAvatar.name),
    );
    httpService = module.get<HttpService>(HttpService);

    jest.spyOn(httpService, 'post').mockImplementation(() => {
      return of({ data: { id: 1 } }) as Observable<AxiosResponse<any>>;
    });

    jest.spyOn(httpService, 'get').mockImplementation(() => {
      return of({
        data: {
          data: {
            id: 1,
            email: 'george.bluth@reqres.in',
            avatar: 'https://reqres.in/img/faces/1-image.jpg',
          },
        },
      }) as Observable<AxiosResponse<any>>;
    });

    connection = module.get<Connection>(getConnectionToken());
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await userModel.deleteMany({ email: testUser.email });
    await connection.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new user and send to queue', async () => {
    const result = await service.createUser(testUser as User);
    expect(result).toBeDefined();
    expect(result.email).toEqual(testUser.email);
    expect(httpService.post).toHaveBeenCalledWith(
      'https://reqres.in/api/users',
      testUser,
    );
    expect(senToQueue).toHaveBeenCalledWith({ userEmail: result.email });
  });

  it('should get user by id', async () => {
    const result = await service.getUser(testUser.id);
    expect(result).toBeDefined();
    expect(httpService.get).toHaveBeenCalledWith(
      `https://reqres.in/api/users/${testUser.id}`,
    );
    expect(result['email']).toBeDefined();
    expect(result['email']).toEqual(testUser.email);
  });

  it('should return base64 encoded image if exists', async () => {
    const userId = 1;
    const base64Image = 'base64Imagc=';

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      Buffer.from(base64Image, 'base64'),
    );

    jest.spyOn(userAvatarModel, 'findOne').mockResolvedValue({
      userId,
      hash: 'cryptohashed101',
      fileName: 'user-1-cryptohashed101.png',
    } as any);

    const result = await service.getUserAvatar(userId);

    expect(result).toBe(base64Image);
  });

  it('should fetch, save, and return base64 encoded image if not exists', async () => {
    const userId = 1;
    const buffer = Buffer.from('image');
    const base64Image = buffer.toString('base64');
    const hash = 'hashedValue';

    jest.spyOn(userAvatarModel, 'findOne').mockResolvedValue({});

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(base64Image);

    (axios.get as jest.Mock).mockResolvedValue({ data: buffer });

    // Mock crypto.createHash to return a mock hash object
    jest.spyOn(crypto, 'createHash').mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue(hash),
    } as any);

    const result = await service.getUserAvatar(userId);

    expect(result).toBe(base64Image);
  });

  it.skip('should delete base64 encoded image if exists', async () => {
    const userId = 1;
    const base64Image = 'base64Imagc=';

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      Buffer.from(base64Image, 'base64'),
    );

    jest.spyOn(userAvatarModel, 'findOne').mockResolvedValue({
      userId,
      hash: 'cryptohashed101',
      fileName: 'user-1-cryptohashed101.png',
    } as any);

    const result = await service.deleteUserAvatar(userId);

    expect(result).toBe(userId);
  });
});
