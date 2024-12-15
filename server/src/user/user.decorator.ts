import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from '../user/user.service';
import { UserDocument } from 'src/schemas/user.schema';

@Injectable()
export class AuthGuard {
  constructor(
    private readonly userService: UserService,
    private readonly reflector: Reflector,
  ) {}

  async validateToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Validate and fetch user data using the UserService
      return await this.userService.getOrCreateUser(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

// Create a decorator for Google OAuth user
export const CurrentUser = createParamDecorator(
  async (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // Extract the token from the Authorization header
    const authorizationHeader = request.headers['authorization'];
    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const token = authorizationHeader.replace('Bearer ', '');

    // Use the injected UserService to validate the token and fetch or create the user
    const userService = request.userService as UserService;

    const user: UserDocument = await userService.getOrCreateUser(token);

    if (!user) {
      throw new UnauthorizedException('User not found or invalid token');
    }

    return user;
  },
);
