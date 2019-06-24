import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { Account } from '../../shared/entities/account';
import { ModelType } from 'typegoose';
import { RegisterDto } from '../../shared/dtos/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from './jwt.payload';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import { Schema } from 'mongoose';
import { AccountDevices, DeviceToken } from '../../shared/entities/account-devices';
import { NotificationService } from '../../shared/helpers/notification/notification.service';

@Injectable()
export class AuthService implements OnApplicationShutdown {
  constructor(
    @InjectModel(Account) private readonly account: ModelType<Account>,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
  ) {
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    await this.account.updateMany({}, {$set: {socketIds: []}}).exec();
  }

  async fromAccount(account: Account): Promise<string> {
    const payload: JwtPayload = { id: String(account._id) };
    return this.jwtService.sign(payload);
  }

  async toAccount(token: string): Promise<Account> {
    const payload: JwtPayload = jwt.decode(token) as JwtPayload;
    try {
      return await this.findAccountByPayload(payload);
    } catch (e) {
      return null;
    }
  }

  async create(data: RegisterDto) {
    data.password = await bcrypt.hash(data.password, 10);
    const acc = new this.account(data);
    return await acc.save();
  }

  async findById(id: string | Schema.Types.ObjectId) {
    return await this.account.findById(id).exec();
  }

  async findAccountByPayload(payload: JwtPayload): Promise<Account> {
    return await this.account.findById(payload.id).exec();
  }

  async findByPhoneNumber(phoneNumber: string) {
    return await this.account.findOne({ phoneNumber }).exec();
  }

  async list(except: string): Promise<Account[]> {
    return await this.account.find({
      _id: {
        $ne: except,
      },
    }).exec();
  }

  async listForSearch(except: string, search: string) {
    return await this.account.find(
      {
        $and: [
          {_id: { $ne: except}},
          {
            $or: [
              {name: {$regex: search, $options: 'i'}},
              {phoneNumber: {$regex: search, $options: 'i'}},
            ],
          },
        ],
      },
    ).exec();
  }

  async addSocketIdForUser(userId: string | Schema.Types.ObjectId, socketId: string) {
      return await this.account.findByIdAndUpdate(userId, {
          $addToSet: {
              socketIds: socketId,
          },
      }).exec();
  }

  async removeSocketIdForUser(userId: string | Schema.Types.ObjectId, socketId: string) {
      return await this.account.findByIdAndUpdate(userId, {
          $pull: {
              socketIds: socketId,
          },
      }).exec();
  }

  async fromSocketIdToAccount(socketId: string) {
    return await this.account.findOne(
      {
        socketIds: {
          $elemMatch: {$eq: socketId},
        },
      },
    ).exec();
  }

  async addDeviceTokenForUser(userId: string, deviceToken: string) {
    const accountDevice = await this.notificationService.findByAccountId(userId);
    const tokenDObj: DeviceToken = {
      token: deviceToken,
      lastUse: new Date().valueOf(),
    };
    if (accountDevice) {
      let deviceTokensN = [];
      let flag = false;
      for (const dt of accountDevice.deviceTokens) {
        if (dt.token === deviceToken) {
          accountDevice.deviceTokens[accountDevice.deviceTokens.indexOf(dt)].lastUse = new Date().valueOf();
          deviceTokensN = accountDevice.deviceTokens;
          await accountDevice.updateOne({
            deviceTokens: deviceTokensN,
          }).exec();
          flag = true;
        }
      }
      if (!flag) {
        if (accountDevice.deviceTokens.length < 3) {
          accountDevice.deviceTokens.push(tokenDObj);
          deviceTokensN = accountDevice.deviceTokens;
        } else {
          let min = accountDevice.deviceTokens[0].lastUse;
          let index = 0;
          for (let i = 1; i < accountDevice.deviceTokens.length; i++) {
            if (accountDevice.deviceTokens[i].lastUse < min) {
              min = accountDevice.deviceTokens[i].lastUse;
              index = i;
            }
          }
          accountDevice.deviceTokens[index] = tokenDObj;
          deviceTokensN = accountDevice.deviceTokens;
        }
        await accountDevice.updateOne({
          deviceTokens: deviceTokensN,
        }).exec();
      }
    } else {
      const data = new AccountDevices(userId, [tokenDObj]);
      await this.notificationService.create(data);
    }
  }
}
