import {arrayProp, prop, Ref, Typegoose} from 'typegoose';
import {Schema} from 'mongoose';
import {Account} from './account';
import {ChatMessage} from './chat-message';

export enum RoomStatus {
    active = 1,
    inactive = -1,
}

export enum RoomType {
    couple = 1,
    group = 2,
}

export class Room extends Typegoose {
    // tslint:disable
    _id: Schema.Types.ObjectId;
    @prop({required: false, default: ''})
    name: string;
    @arrayProp({required: true, itemsRef: Account})
    members: Ref<Account>[];
    @prop({required: true, default: Date.now})
    createdAt: number;
    @prop({required: true, default: Date.now})
    updatedAt: number;
    @prop({required: true, default: RoomStatus.active})
    status: RoomStatus;
    @prop({required: true, default: RoomType.couple})
    type: RoomType;
}
