import { Controller, Get, Post, Body, UseGuards, Headers, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from './entities/user.entity';
import { Auth, GetUser, RawHeaders } from './decorators';
import { IncomingHttpHeaders } from 'http';
import { UserRoleGuard } from './guards/user-role.guard';
import { RoleProtected } from './decorators/role-protected.decorator';
import { validRoles } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create( createUserDto );
  }

  @Post('login')
  loginUser( @Body() loginUserDto: LoginUserDto ) {
    return this.authService.login( loginUserDto )
  }

  @Get('check-status')
  @Auth()
  checkAuthStatus(
    @GetUser() user: User
  ) {
    return this.authService.checkAuthStatus( user );
  }

  @Get('private')
  @UseGuards( AuthGuard() )
  testingPrivateRoute(
    @GetUser() user: User,
    @GetUser('email') userEmail: string,
    @RawHeaders() rawHeaders: string[],
    @Headers() headers: IncomingHttpHeaders,
  ) {
    return {
      user,
      userEmail,
      rawHeaders,
      headers
    }
  }

  //@SetMetadata('roles', ['admin', 'super-user'])
  @Get('private2')
  @RoleProtected( validRoles.superUser )
  @UseGuards( 
    AuthGuard(),
    UserRoleGuard
  )
  privateRoute2(
    @GetUser() user: User
  ) {
    return {
      ok: true,
      user,
    }
  }

  @Get('private3')
  @Auth( validRoles.admin )
  privateRoute3(
    @GetUser() user: User
  ) {
    return {
      ok: true,
      user,
    }
  }


}
