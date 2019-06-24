import { HttpService, Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { AccountDevices, DeviceToken } from '../../entities/account-devices';
import { ModelType } from 'typegoose';
import { Schema } from 'mongoose';
import { NotificationData } from './entites/NotificationData';
import { NotificationContent } from './entites/NotificationContent';
import { NOTIFICATION_AUTHORIZATION, NOTIFICATION_URL } from '../../resources/constants.resource';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(AccountDevices) private readonly model: ModelType<AccountDevices>,
    private readonly http: HttpService,
  ) {
  }

  async create(data: AccountDevices) {
    const accountDevice = new this.model(data);
    return await accountDevice.save();
  }

  async findByAccountId(account: string) {
    return await this.model.findOne({ account }).exec();
  }

  async findAll() {
    return await this.model.find().exec();
  }

  // async updateDeviceToken(account: string, deviceToken: string, room: string = '') {
  //   return await this.model.updateOne(
  //     {
  //       'account': account,
  //       'deviceTokens.token': deviceToken,
  //     },
  //     {
  //       $set: {
  //         'deviceTokens.$.room': room,
  //       },
  //     },
  //   ).exec();
  // }

  async addDeviceForAccount(accountId: string | Schema.Types.ObjectId, deviceToken: DeviceToken) {
    return await this.model.findOneAndUpdate(
      {
        'account': accountId,
        'deviceToken.token': {
          $ne: deviceToken.token,
        },
      },
      {
        $push: {
          deviceTokens: deviceToken,
        },
      },
    ).exec();
  }

  async sendNotifyByToken(deviceTokens: string[], notificationData: NotificationData, notificationContent: NotificationContent = null) {
    let data: any = {
      registration_ids: deviceTokens,
      data: notificationData,
    };

    if (notificationContent !== null) {
      data = {
        ...data,
        notification: notificationContent,
      };
    }

    console.log('lol data + ', data);
    const res: any = await this.http.post(NOTIFICATION_URL, data, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'authorization': 'key=' + NOTIFICATION_AUTHORIZATION,
      },
    }).toPromise();
  }
}
