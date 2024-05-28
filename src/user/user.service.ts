import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class UserService {
  constructor(private httpService: HttpService) {}

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

  createUser(user: any): Observable<AxiosResponse<any>> {
    return this.httpService
      .post('https://reqres.in/api/users', user)
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
