import { Injectable, NestMiddleware } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly httpService: HttpService,
  ) {}

  async getOrCreateUser(googleOauthToken: string): Promise<UserDocument> {
    const response = await lastValueFrom(
      this.httpService.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleOauthToken}` },
      }),
    );

    const googleUser = response.data;
    let user: UserDocument = await this.userModel
      .findOne({ sub: googleUser.sub })
      .exec();
    // Update the users oauth token
    if (user) {
      user.googleOauthToken = googleOauthToken;
      await user.save();
    } else {
      user = new this.userModel({
        ...googleUser,
        googleOauthToken: googleOauthToken,
      });
      await user.save();
    }

    return user;
  }
}

// Inject the UserService into the middleware for use in
// the CurrentUser decorator
@Injectable()
export class UserServiceMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  use(req: any, res: any, next: () => void) {
    req.userService = this.userService;
    next();
  }
}
