import {Account} from '../entities/account';
import {ChatMessage, ChatMessageStatus} from '../entities/chat-message';
import {AccountResDto} from './account-res-dto';
import {RoomResDto, RoomResDtoOption} from './room-res-dto';
import {Room} from '../entities/room';
import { format } from 'date-fns';
import { CLIENT_DATE_FORMAT } from '../resources/constants.resource';

export class MessageResDto {
    // tslint:disable
    _id: string;
    sender: AccountResDto;
    room: RoomResDto;
    message: string;
    createdAt: number;
    createdAtStr: string;
    updatedAt: number;
    updatedAtStr: string;
    status: ChatMessageStatus;

    constructor(chatMessage: ChatMessage, options?: any[], lastMess?: string, quantityUnread?: number) {
        this._id = String(chatMessage._id);
        this.sender = new AccountResDto(chatMessage.sender as Account);
        this.room = new RoomResDto(chatMessage.room as Room, options, lastMess, quantityUnread);
        this.createdAt = chatMessage.createdAt;
        this.createdAtStr = format(chatMessage.createdAt, CLIENT_DATE_FORMAT);
        this.updatedAt = chatMessage.updatedAt;
        this.updatedAtStr = format(chatMessage.createdAt, CLIENT_DATE_FORMAT);
        this.status = chatMessage.status;
        this.message = chatMessage.message;
    }
}
