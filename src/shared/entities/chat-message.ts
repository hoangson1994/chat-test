import { arrayProp, prop, Ref, Typegoose } from 'typegoose';
import { Schema } from 'mongoose';
import { Account } from './account';
import { Room } from './room';

export enum ChatMessageStatus {
    unread = 1,
    read = 2,
    deleted = -1,
}

export class ChatMessage extends Typegoose {
    // tslint:disable
    _id: Schema.Types.ObjectId;
    @prop({ required: true, ref: Account })
    sender: Ref<Account>;
    @prop({ required: true, ref: Room })
    room: Ref<Room>;
    @prop({ required: true })
    message: string;
    @prop({ required: true, default: Date.now })
    createdAt: number;
    @prop({ required: true, default: Date.now })
    updatedAt: number;
    @prop({ required: true, default: ChatMessageStatus.unread })
    status: ChatMessageStatus;
    @arrayProp({required: false, itemsRef: Account})
    readedBy: Ref<Account>[];

}
