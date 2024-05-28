import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';

@Controller('api')
export class UserController {
  constructor(private readonly reqresService: UserService) {}

  @Post('users')
  async createUser(@Body() user: any) {
    try {
      const results = await this.reqresService.createUser(user);
      if (!results) {
        throw new HttpException(
          'failed to create user',
          HttpStatus.BAD_REQUEST,
        );
      }
      return results;
    } catch (error) {
      console.log(error.cause); //this will be replaced with a proper logger
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
