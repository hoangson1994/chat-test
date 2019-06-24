import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ChatMessage, ChatMessageStatus } from '../../shared/entities/chat-message';
import { ModelType } from 'typegoose';
import { Types } from 'mongoose';
import { Room } from '../../shared/entities/room';
import { RoomsService } from './rooms.service';

@Injectable()
export class ChatMessageService {
  constructor(
    @InjectModel(ChatMessage) private readonly model: ModelType<ChatMessage>,
    @InjectModel(Room) private readonly roomModel: ModelType<Room>,
    private readonly roomService: RoomsService,
  ) {
  }

  async create(dto: any) {
    const message = new this.model(dto);
    const messagePromise = message.save();
    await this.roomModel.findByIdAndUpdate(dto.room, { $set: { updatedAt: new Date().valueOf() } }).exec();
    return await messagePromise;
  }

  async updateMessageStatusToRead(room: string, numMember: number) {
    return await this.model.updateMany(
      {
        room,
        status: ChatMessageStatus.unread,
        readedBy: {$size: (numMember - 1)},
      },
      {
        $set: {status: ChatMessageStatus.read},
      },
    ).exec();
  }

  async addReadedUserForMessage(account: string, room: string) {
    return await this.model.updateMany(
      {
        sender: {$ne: account},
        room,
        status: {$ne: ChatMessageStatus.read},
      },
      {
        $addToSet: { readedBy: account},
      },
    ).exec();
  }

  async countMessagesInRoomByStatus(room: string, account: string, status: number = ChatMessageStatus.unread): Promise<any> {
    return await this.model.countDocuments(
      {
        room,
        sender: {$ne: account},
        status,
        readedBy: {$ne: account},
      },
    ).exec();
  }

  async findByRoom(room: string) {
    return await this.model.aggregate()
      .match({
        room: Types.ObjectId(room),
      })
      .lookup({
        from: 'accounts',
        localField: 'sender',
        foreignField: '_id',
        as: 'sender',
      })
      .lookup({
        from: 'rooms',
        localField: 'room',
        foreignField: '_id',
        as: 'room',
      })
      .unwind({
        path: '$sender',
        preserveNullAndEmptyArrays: true,
      })
      .unwind({
        path: '$room',
        preserveNullAndEmptyArrays: true,
      })
      .exec();
    // return await this.model.aggregate([
    //     {
    //         $match: {room: Types.ObjectId(room)},
    //     },
    //     {
    //         $lookup:
    //             {
    //                 from: 'accounts',
    //                 localField: 'sender',
    //                 foreignField: '_id',
    //                 as: 'sender',
    //             },
    //     },
    //     {
    //         $unwind: {
    //             path: '$sender',
    //             preserveNullAndEmptyArrays: true,
    //         },
    //     },
    //     // {
    //     //     $group: {
    //     //         _id: {
    //     //             date: {$dateToString: {format: '%d-%m-%Y', date: {$add: [new Date(0), '$updatedAt']}}},
    //     //         },
    //     //         messages: {
    //     //             $push: '$$ROOT',
    //     //         },
    //     //     },
    //     // },
    // ]).exec();
  }

  async findById(id: string) {
    const result = await this.model.aggregate()
      .match({ _id: Types.ObjectId(id) })
      .lookup({
        from: 'accounts',
        localField: 'sender',
        foreignField: '_id',
        as: 'sender',
      })
      .lookup({
        from: 'rooms',
        let: { room_id: '$room' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', '$$room_id'],
              },
            },
          },
          {
            $lookup: {
              from: 'accounts',
              localField: 'members',
              foreignField: '_id',
              as: 'members',
            },
          },
        ],
        as: 'room',
      })
      .unwind({
        path: '$sender',
        preserveNullAndEmptyArrays: true,
      })
      .unwind({
        path: '$room',
        preserveNullAndEmptyArrays: true,
      })
      .exec();
    if (result && result.length > 0) {
      return result[0];
    }
    return null;
  }

  async checkAndUpdateMessageStatus(account: string, room: string) {
    await this.addReadedUserForMessage(account, room);
    const countMember = await this.roomService.countNumMember(room);
    if (countMember && countMember.length > 0) {
      await this.updateMessageStatusToRead(room, countMember[0].numMember);
    }
  }
}
