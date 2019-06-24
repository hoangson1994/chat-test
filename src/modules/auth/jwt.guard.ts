import {ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import { Observable } from 'rxjs';
import {AuthGuard} from '@nestjs/passport';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  canActivate(
      context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token sai hoặc đã hết hạn');
    }
    return user;
  }
}
