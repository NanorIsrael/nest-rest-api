import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';

@Controller('api')
export class UserController {
  constructor(private readonly reqresService: UserService) {}

  @Post('users')
  createUser(@Body() user: any): Observable<AxiosResponse<any>> {
    return this.reqresService.createUser(user);
  }

  @Get('users')
  getUsers(): Observable<AxiosResponse<any>> {
    return this.reqresService.getUsers();
  }

  @Get('users/:id')
  getUser(@Param('id') id: number): Observable<AxiosResponse<any>> {
    return this.reqresService.getUser(id);
  }

  @Put('users/:id')
  updateUser(
    @Param('id') id: number,
    @Body() user: any,
  ): Observable<AxiosResponse<any>> {
    return this.reqresService.updateUser(id, user);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: number): Observable<AxiosResponse<any>> {
    return this.reqresService.deleteUser(id);
  }
}
