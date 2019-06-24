import { arrayProp, index, pre, prop, Typegoose } from 'typegoose';
import {Schema} from 'mongoose';

export enum AccountStatus {
    active = 1,
    inactive = -1,
}

@index({name: 'text', phoneNumber: 'text'})
export class Account extends Typegoose {
    // tslint:disable
    _id: Schema.Types.ObjectId;
    @prop({required: true, unique: true})
    phoneNumber: string;
    @prop({required: true})
    password: string;
    @prop({default: ''})
    name: string;
    @prop({required: true, default: Date.now})
    createdAt: number;
    @prop({required: true, default: Date.now})
    updatedAt: number;
    @prop({required: true, default: AccountStatus.active})
    status: number;
    @arrayProp({default: [], items: String})
    socketIds: string[];
}
