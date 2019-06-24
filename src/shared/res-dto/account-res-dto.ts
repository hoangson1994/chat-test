import {Account} from '../entities/account';
import {parse, format} from 'date-fns';
import {CLIENT_DATE_FORMAT} from '../resources/constants.resource';

export class AccountResDto {
    // tslint:disable
    _id: string;
    phoneNumber: string;
    name: string;
    createdAt: number;
    createdAtStr: string;
    updatedAt: number;
    updatedAtStr: string;
    accessToken: string;
    status: number;

    constructor(account: Account, token?: string) {
        this._id = String(account._id);
        this.phoneNumber = account.phoneNumber;
        this.createdAt = account.createdAt;
        this.updatedAt = account.updatedAt;
        this.accessToken = token || null;
        this.status = account.status;
        this.createdAtStr = format(parse(account.createdAt), CLIENT_DATE_FORMAT);
        this.updatedAtStr = format(parse(account.updatedAt), CLIENT_DATE_FORMAT);
        this.name = account.name;
    }
}
