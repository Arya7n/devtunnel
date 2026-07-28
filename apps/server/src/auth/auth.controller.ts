import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthService, type AuthUser } from './auth.service';
import { CreateApiKeyDto } from './dto/api-key.dto';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.auth.register(body.email, body.password, body.name);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }

  @Post('refresh')
  refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('api-keys')
  createApiKey(@CurrentUser() user: AuthUser, @Body() body: CreateApiKeyDto) {
    return this.auth.createApiKey(user.id, body.label ?? 'default');
  }

  @UseGuards(JwtAuthGuard)
  @Get('api-keys')
  listApiKeys(@CurrentUser() user: AuthUser) {
    return this.auth.listApiKeys(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('api-keys/:id')
  revokeApiKey(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.auth.revokeApiKey(user.id, id);
  }
}
