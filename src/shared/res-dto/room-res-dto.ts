import { Room, RoomStatus, RoomType } from '../entities/room';
import {Account} from '../entities/account';
import {AccountResDto} from './account-res-dto';
import {format} from 'date-fns';
import {CLIENT_DATE_FORMAT} from '../resources/constants.resource';

export enum RoomResDtoOption {
    join_members = 'room_join_members',
    with_last_message_and_num_unread = 'room_with_last_message_and_num_unread',
}

export class RoomResDto {
    // tslint:disable
    _id: string;
    members: AccountResDto[];
    name: string;
    createdAt: number;
    createdAtStr: string;
    updatedAt: number;
    updatedAtStr: string;
    status: RoomStatus;
    type: RoomType;
    lastMessage: string;
    quantityUnread: number;

    constructor(room: any, options?: any[], lastMess: string = '', quantityUnread: number = 0) {
        this._id = String(room._id);
        this.name = room.name;
        this.createdAt = room.createdAt;
        this.updatedAt = room.updatedAt;
        this.status = room.status;
        this.type = room.type;
        this.createdAtStr = format(room.createdAt, CLIENT_DATE_FORMAT);
        this.updatedAtStr = format(room.updatedAt, CLIENT_DATE_FORMAT);
        this.members = [];
        this.lastMessage = lastMess;
        this.quantityUnread = quantityUnread;
        if (options) {
            if (room.members && options.includes(RoomResDtoOption.join_members)) {
                this.members = room.members.map(mem => {
                    return new AccountResDto(mem as Account);
                });
            }
            if (room.messages && options.includes(RoomResDtoOption.with_last_message_and_num_unread)) {
                this.lastMessage = (room.messages.data && room.messages.data[0] && room.messages.data[0].message) || '';
                this.quantityUnread = (room.messages.count && room.messages.count[0] && room.messages.count[0].quantityUnread) || 0;
            }
        }
    }
}
