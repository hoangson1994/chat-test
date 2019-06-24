import { Account } from '../entities/account';
import { ChatMessage, ChatMessageStatus } from '../entities/chat-message';
import { AccountResDto } from './account-res-dto';
import { RoomResDto } from './room-res-dto';
import { Room } from '../entities/room';
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
        this._id = chatMessage._id ? String(chatMessage._id) : null;
        this.sender = chatMessage.sender ? new AccountResDto(chatMessage.sender as Account) : null;
        this.room = chatMessage.room ? new RoomResDto(chatMessage.room as Room, options, lastMess, quantityUnread) : null;
        this.createdAt = chatMessage.createdAt ? chatMessage.createdAt : 0;
        this.createdAtStr = chatMessage.createdAt ? format(chatMessage.createdAt, CLIENT_DATE_FORMAT) : null;
        this.updatedAt = chatMessage.updatedAt ? chatMessage.updatedAt : 0;
        this.updatedAtStr = chatMessage.updatedAt ? format(chatMessage.updatedAt, CLIENT_DATE_FORMAT) : null;
        this.status = chatMessage.status ? chatMessage.status : ChatMessageStatus.unread;
        this.message = chatMessage.message ? chatMessage.message : null;
    }
}
