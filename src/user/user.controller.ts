import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './user-dto';

@Controller('api')
export class UserController {
  constructor(private readonly reqresService: UserService) {}

  @Post('users')
  async createUser(@Body() user: CreateUserDto) {
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
      console.log(error); //this will be replaced with a proper logger
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('user/:id/avatar')
  getUserAvatar(@Param('id') id: number): Promise<any> {
    return this.reqresService.getUserAvatar(id);
  }

  @Get('user/:id')
  async getUser(@Param('id') id: number) {
    return await this.reqresService.getUser(id);
  }

  @Delete('user/:id/avatar')
  async deleteUserAvatar(@Param('id') id: number) {
    try {
      const result = await this.reqresService.deleteUserAvatar(id);
      if (!result) {
        throw new HttpException(
          'user avatar does not exist',
          HttpStatus.BAD_REQUEST,
        );
      }
      return result;
    } catch (error) {
      console.log(error); //this will be replaced with a proper logger
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
