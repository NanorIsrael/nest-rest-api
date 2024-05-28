import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import {
  MongooseModule,
  getConnectionToken,
  getModelToken,
} from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { Model } from 'mongoose';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Observable, of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { senToQueue } from '../common/queue-service';
import { Connection } from 'mongoose';

jest.mock('../common/queue-service', () => ({
  senToQueue: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<User>;
  let httpService: HttpService;
  let testUser: Partial<User>;

  let connection: Connection;

  beforeEach(async () => {
    testUser = {
      email: 'jupiter.bluth@reqres.in',
      first_name: 'Alaska',
      last_name: 'Daniel',
      avatar: 'https://reqres.in/img/faces/2-image.jpg',
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        MongooseModule.forRoot('mongodb://localhost/nest'),
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
      ],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<Model<User>>(getModelToken('User'));
    httpService = module.get<HttpService>(HttpService);

    jest.spyOn(httpService, 'post').mockImplementation(() => {
      return of({ data: { id: 1 } }) as Observable<AxiosResponse<any>>;
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
    expect(senToQueue).toHaveBeenCalledWith(result);
  });
});
