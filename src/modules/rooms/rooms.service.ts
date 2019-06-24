import { Injectable } from '@nestjs/common';
import { ModelType } from 'typegoose';
import { Room, RoomType } from '../../shared/entities/room';
import { InjectModel } from 'nestjs-typegoose';
import { ChatMessageStatus } from '../../shared/entities/chat-message';
import { Types } from 'mongoose';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room) private readonly roomModel: ModelType<Room>,
  ) {
  }

  async save(members: string[]): Promise<Room> {
    const room = new this.roomModel({ members });
    return (await room.save());
  }

  async list(id: string): Promise<Room[]> {
    // return await this.roomModel.find({members: id}).populate('members').sort({updatedAt: -1}).exec();

    return await this.roomModel.aggregate()
      .match({ members: id })
      .lookup({
        from: 'chatmessages',
        let: { id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$room', '$$id'],
              },
            },
          },
          {
            $facet: {
              count: [
                {
                  $match:
                    {
                      status: ChatMessageStatus.unread,
                      sender: { $ne: id },
                      readedBy: {$ne: id},
                    },
                },
                { $count: 'quantityUnread' },
              ],
              data: [
                {
                  $sort: {
                    createdAt: -1,
                  },
                },
                { $skip: 0 }, { $limit: 1 },
              ],
            },
          },
        ],
        as: 'messages',
      })
      .unwind({
        path: '$messages',
        preserveNullAndEmptyArrays: true,
      })
      .lookup({
        from: 'accounts',
        localField: 'members',
        foreignField: '_id',
        as: 'members',
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async createGroupByNameAndMembers(name: string, members: string[]) {
    const group = new this.roomModel({
      name,
      members,
      type: RoomType.group,
    });
    return (await group.save());
  }

  async findById(id: string) {
    return await this.roomModel.findById(id).exec();
  }
  async findByIdWithMember(id: string): Promise<Room> {
    return await this.roomModel.findById(id).populate('members').exec();
  }

  async findByIdAndMemberIdWithMember(_id: string, members: string) {
    return await this.roomModel.find({
      _id,
      members,
    }).populate('members').exec();
  }

  async findByMemberIds(selfId: string, accountId: string): Promise<Room> {
    let result = await this.roomModel.findOne({
      members: {
        $all: [selfId, accountId],
      },
      type: RoomType.couple,
    }).exec();
    if (!result) {
      result = new this.roomModel({
        members: [selfId, accountId],
      });
      await result.save();
    }
    return result;
  }

  async countNumMember(room: string) {
    return await this.roomModel.aggregate()
      .match({
        _id: Types.ObjectId(room),
      })
      .project({
        _id: 1,
        numMember: {
          $cond: {
            if: { $isArray: '$members' },
            then: { $size: '$members' },
            else: 0,
          },
        },
      }).exec();
  }
}
