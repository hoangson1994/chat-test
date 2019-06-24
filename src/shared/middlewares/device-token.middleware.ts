import { Injectable, NestMiddleware, NotFoundException, Req } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import * as bcrypt from 'bcryptjs';
import { NotificationService } from '../helpers/notification/notification.service';
import { Account } from '../entities/account';
@Injectable()
export class DeviceTokenMiddleware implements NestMiddleware {

  constructor(
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
  ) {
  }
  async use(req: Request, res: Response, next: () => void) {
    let account: Account;
    const header: any = req.headers;
    const deviceToken = header.tokendevice;
    console.log(header);
    if (!deviceToken) {
      return next();
    } else {
      const authorization = header.authorization;
      if (authorization) {
        const tokenJwt = authorization.replace('Bearer ', '');
        account = await this.authService.toAccount(tokenJwt);
      } else {
        const body: any = req.body;
        if (!body.phoneNumber || !body.password) {
          return next();
        }
        account = await this.authService.findByPhoneNumber(body.phoneNumber);
        if (!account || !(await bcrypt.compare(body.password, account.password))) {
          return next();
        }
      }
    }

    if (account) {
      await this.authService.addDeviceTokenForUser(String(account._id), deviceToken);
    }
    next();
  }
}
