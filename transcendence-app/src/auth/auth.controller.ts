import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Req,
  Request as GetRequest,
  Res,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiFoundResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthenticatedGuard } from '../shared/guards/authenticated.guard';
import { LoginUserDto } from '../user/dto/login-user.dto';
import { RegisterUserDto } from '../user/dto/register-user.dto';
import { AuthService } from './auth.service';
import { LocalGuard } from './local.guard';
import { OAuth42Guard } from './oauth42.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @ApiOkResponse({ description: 'Login successfully' })
  @ApiFoundResponse({ description: 'Redirect to 42 OAuth server' })
  @ApiServiceUnavailableResponse({ description: 'Service unavailable' })
  @UseGuards(OAuth42Guard)
  oauth42Login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { state } = req.query;
    if (typeof state === 'string') {
      res.redirect(state);
    }
  }

  @Delete('logout')
  @UseGuards(AuthenticatedGuard)
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiOkResponse({ description: 'Logout successfully' })
  @ApiNotFoundResponse({ description: 'Not Found' })
  logout(@GetRequest() req: Request) {
    req.logout((err: Error) => {
      if (err) {
        throw new NotFoundException(err.message);
      }
    });
  }

  @Post('local/register')
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnprocessableEntityResponse({ description: 'Unprocessable Entity' })
  async registerLocalUser(@Body() registerUserDto: RegisterUserDto) {
    const user = await this.authService.registerLocalUser(registerUserDto);

    if (!user) {
      throw new UnprocessableEntityException();
    }
    return user;
  }

  @Post('local/login')
  @UseGuards(LocalGuard)
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loginLocalUser(@Req() req: Request, @Body() user: LoginUserDto) {
    return req.user;
  }
}
