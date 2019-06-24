import { arrayProp, prop, Ref, Typegoose } from 'typegoose';
import { Schema } from 'mongoose';
import { Account } from './account';

export enum AccountDeviceStatus {
  active = 1,
  inactive = -1,
}

export class DeviceToken {
  token: string;
  lastUse: number;
}
export class AccountDevices extends Typegoose {

  //tslint:disable
  _id: Schema.Types.ObjectId;

  @prop({required: true, ref: Account})
  account: Ref<Account>;

  @arrayProp({required: true, default: [], items: DeviceToken})
  deviceTokens: DeviceToken[];

  @prop({required: true, default: Date.now})
  createdAt: number;

  @prop({required: true, default: Date.now})
  updatedAt: number;

  @prop({required: true, default: AccountDeviceStatus.active})
  status: AccountDeviceStatus;

  constructor(account: any, deviceTokens: DeviceToken[]) {
    super();
    this.account = account;
    this.deviceTokens = deviceTokens;
    this.createdAt = new Date().valueOf();
    this.updatedAt = new Date().valueOf();
    this.status = AccountDeviceStatus.active;
  }
}
