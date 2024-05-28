import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Observable, lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';
import { senToQueue } from '../common/queue-service';
import { CreateUserDto } from './user-dto';

@Injectable()
export class UserService {
  constructor(
    private httpService: HttpService,
    @InjectModel('User') private userModel: Model<User>,
  ) {}

  async createUser(user: CreateUserDto): Promise<User | null> {
    const response = await lastValueFrom(
      this.httpService
        .post('https://reqres.in/api/users', user)
        .pipe(map((res) => res.data)),
    );

    if (response && response.id) {
      const newUser = new this.userModel({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
      });

      await newUser.save();
      await senToQueue(newUser);

      return newUser;
    }
  }

  getUsers(): Observable<AxiosResponse<any>> {
    return this.httpService
      .get('https://reqres.in/api/users')
      .pipe(map((response) => response.data));
  }

  getUser(id: number): Observable<AxiosResponse<any>> {
    return this.httpService
      .get(`https://reqres.in/api/users/${id}`)
      .pipe(map((response) => response.data));
  }

  updateUser(id: number, user: any): Observable<AxiosResponse<any>> {
    return this.httpService
      .put(`https://reqres.in/api/users/${id}`, user)
      .pipe(map((response) => response.data));
  }

  deleteUser(id: number): Observable<AxiosResponse<any>> {
    return this.httpService
      .delete(`https://reqres.in/api/users/${id}`)
      .pipe(map((response) => response.data));
  }
}
