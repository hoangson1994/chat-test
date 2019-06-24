import { Body, Controller, Get, NotFoundException, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Room, RoomType } from '../../shared/entities/room';
import { RoomsService } from './rooms.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RoomResDto, RoomResDtoOption } from '../../shared/res-dto/room-res-dto';
import { ChatMessageService } from './chat-message.service';
import { MessageResDto } from '../../shared/res-dto/message-res.dto';
import { transformPipe } from '../../shared/resources/constants.resource';
import { GroupDto } from '../../shared/dtos/group.dto';
import { AuthService } from '../auth/auth.service';
import { AddRemoveMembersGroupDto } from '../../shared/dtos/add-remove-members-group.dto';
import { RenameGroupDto } from '../../shared/dtos/rename-group.dto';
import { SocketServerService } from '../../shared/services/socket-server/socket-server.service';
import { ChatEvent } from './room.gateway';
import { Account } from '../../shared/entities/account';
import { ChatMessage } from '../../shared/entities/chat-message';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly messagesService: ChatMessageService,
    private readonly authService: AuthService,
    private readonly socketServer: SocketServerService,
  ) {
  }

  @Get('single')
  @UseGuards(JwtGuard)
  async create(@Query('account_id') accountId: string, @Req() req): Promise<Room> {
    const selfId = req.user._id;
    return await this.roomsService.findByMemberIds(selfId, accountId);
  }

  @Get('get-single')
  @UseGuards(JwtGuard)
  async single(@Query('room_id') roomId: string, @Req() req) {
    const userId = req.user._id;
    const room = await this.roomsService.findByIdAndMemberIdWithMember(roomId, userId);
    if (!room || room.length === 0) {
      throw new NotFoundException('Not found room');
    }
    return new RoomResDto(room[0], [RoomResDtoOption.join_members]);
  }

  @Get('messages')
  @UseGuards(JwtGuard)
  async messages(@Query('room_id') roomId: string, @Req() req) {
    const userId = req.user._id;
    const room = await this.roomsService.findByIdAndMemberIdWithMember(roomId, userId);
    if (!room || room.length  === 0) {
      throw new NotFoundException('Not found message for room');
    }
    const messages = await this.messagesService.findByRoom(roomId);
    return messages
      .map(message => new MessageResDto(message));
  }

  @Post('create-group')
  @UseGuards(JwtGuard)
  async createGroup(@Body(transformPipe) groupDto: GroupDto, @Req() req) {
    const selfId = req.user._id;
    if (!groupDto.members.includes(selfId)) {
      groupDto.members.push(selfId);
    }
    const roomGroup = await this.roomsService.createGroupByNameAndMembers(groupDto.name, groupDto.members);
    const room = await this.roomsService.findByIdWithMember(roomGroup._id);
    // const resData = new RoomResDto(room, [RoomResDtoOption.join_members]);
    const mess = new ChatMessage();
    mess.room = room;
    const resDataSocket = {
      status: 1,
      message: 'Chat message',
      data: new MessageResDto(mess, [RoomResDtoOption.join_members]),
    };
    room.members.forEach((member: Account) => {
      member.socketIds.forEach((socket) => {
        this.socketServer.server.to(socket).emit(ChatEvent.chat, resDataSocket);
      });
    });
    return new RoomResDto(room, [RoomResDtoOption.join_members]);
  }

  @Post('add-members-group')
  @UseGuards(JwtGuard)
  async addMemberToGroup(@Body(transformPipe) addMemberDto: AddRemoveMembersGroupDto, @Req() req) {
    const room = await this.roomsService.findById(addMemberDto.room);
    if (!room || !room.members.includes(req.user._id)) {
      throw new NotFoundException('Not found room');
    }

    const membersNew = room.members;
    if (addMemberDto.members && addMemberDto.members.length > 0) {
      for (const memId of addMemberDto.members) {
        const member = await this.authService.findById(memId);
        if (member && !room.members.includes(member._id)) {
          membersNew.push(member._id);
        }
      }
    }

    try {
      await room.updateOne({
        members: membersNew,
      }).exec();
    } catch (e) {
      throw new NotFoundException('Error update group');
    }

    const roomRes = await this.roomsService.findByIdWithMember(room._id);
    return new RoomResDto(roomRes, [RoomResDtoOption.join_members]);
  }

  @Post('remove-members-group')
  @UseGuards(JwtGuard)
  async removeMemberToGroup(@Body(transformPipe) removeMemberDto: AddRemoveMembersGroupDto, @Req() req) {
    const room = await this.roomsService.findById(removeMemberDto.room);
    if (!room || !room.members.includes(req.user._id)) {
      throw new NotFoundException('Not found room');
    }

    const membersNew = room.members;
    if (removeMemberDto.members && removeMemberDto.members.length > 0) {
      for (const memId of removeMemberDto.members) {
        const member = await this.authService.findById(memId);
        if (member && room.members.includes(member._id)) {
          membersNew.splice(membersNew.indexOf(member._id), 1);
        }
      }
    }

    try {
      await room.updateOne({
        members: membersNew,
      }).exec();
    } catch (e) {
      throw new NotFoundException('Error update group');
    }

    const roomRes = await this.roomsService.findByIdWithMember(room._id);
    return new RoomResDto(roomRes, [RoomResDtoOption.join_members]);
  }

  @Post('rename-group')
  @UseGuards(JwtGuard)
  async updateGroup(@Body(transformPipe) renameGroupDto: RenameGroupDto, @Req() req) {
    const room = await this.roomsService.findById(renameGroupDto.room);
    if (!room || !room.members.includes(req.user._id)) {
      throw new NotFoundException('Not found room');
    }

    let name = room.name;
    if (renameGroupDto.name) {
      name = renameGroupDto.name;
    }

    try {
      await room.updateOne({name}).exec();
    } catch (e) {
      throw new NotFoundException('Error Update room');
    }
    const roomRes = await this.roomsService.findByIdWithMember(room._id);
    return new RoomResDto(roomRes, [RoomResDtoOption.join_members]);
  }

  @Get('list')
  @UseGuards(JwtGuard)
  async list(@Req() req) {
    const user = req.user;
    const rooms = await this.roomsService.list(user._id);
    if (!rooms) {
      throw new NotFoundException('Can not found any rooms');
    }

    const roomsFilter = [];
    for (const room of rooms) {
      const messageByRoom = await this.messagesService.findByRoom(String(room._id));
      if ((messageByRoom && messageByRoom.length > 0) || room.type === RoomType.group) {
        roomsFilter.push(room);
      }
    }

    return roomsFilter.map(room => {
      return new RoomResDto(room, [RoomResDtoOption.join_members, RoomResDtoOption.with_last_message_and_num_unread]);
    });
  }
}
