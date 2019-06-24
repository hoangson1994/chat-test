import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Client, Server } from 'socket.io';
import { RoomsService } from './rooms.service';
import { AuthService } from '../auth/auth.service';
import { Account } from '../../shared/entities/account';
import { ChatMessageService } from './chat-message.service';
import { MessageResDto } from '../../shared/res-dto/message-res.dto';
import { NotificationService } from '../../shared/helpers/notification/notification.service';
import { DeviceToken } from '../../shared/entities/account-devices';
import { NotificationContent } from '../../shared/helpers/notification/entites/NotificationContent';
import { Logger } from '@nestjs/common';
import { RoomResDtoOption } from '../../shared/res-dto/room-res-dto';
import { RoomType } from '../../shared/entities/room';
import { NotificationData } from '../../shared/helpers/notification/entites/NotificationData';
import { SocketServerService } from '../../shared/services/socket-server/socket-server.service';

interface AuthorizationData {
  authorization: string;
}

interface ChatData {
  message: string;
  room: string;
}

interface JoinRoomData {
  room: string;
}

interface LeaveRoomData {
  room: string;
}

export enum ChatEvent {
  chat = 'chat',
  message = 'message',
  join_room = 'joinRoom',
}

@WebSocketGateway({ namespace: 'rooms' })
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly roomsService: RoomsService,
    private readonly authService: AuthService,
    private readonly mesageService: ChatMessageService,
    private readonly notifyService: NotificationService,
    private readonly socketServer: SocketServerService,
  ) {
    socketServer.server = this.server;
  }

  handleConnection(client: Client, ...args: any[]): any {
    Logger.log('socket connected', client.id);
  }

  async handleDisconnect(client: any): Promise<any> {
    console.log('disconnect from ', client.id);
    const user = client.user;
    if (user) {
      try {
        await this.authService.removeSocketIdForUser(user._id, client.id);
      } catch (e) {
        console.log(e);
      }
    }
  }

  @SubscribeMessage('authorization')
  async authorization(client: any, data: AuthorizationData) {
    const user = await this.authService.toAccount(data.authorization);
    if (!user) {
      client.auth = false;
    } else {
      client.auth = true;
      client.user = user;
      try {
        await this.authService.addSocketIdForUser(user._id, client.id);
      } catch (e) {
        console.log(e);
      }
    }
    return {
      authorization: client.auth,
      clientId: client.id,
    };
  }

  @SubscribeMessage('join')
  async join(client: any, data: JoinRoomData) {
    if (!client.auth) {
      return {
        status: 0,
        message: 'Unauthorized',
      };
    }

    client.join(data.room);

    try {
      await this.mesageService.checkAndUpdateMessageStatus(client.user._id, data.room);
    } catch (e) {
      console.log(e);
    }

    return {
      status: 1,
      message: 'Success',
    };
  }

  @SubscribeMessage('leave')
  async leaveRoom(client: any, data: LeaveRoomData) {
    if (!client.auth) {
      return {
        status: 0,
        message: 'Unauthorized',
      };
    }

    client.leave(data.room);
    return {
      status: 1,
      message: 'Success',
    };
  }

  @SubscribeMessage('chat')
  async chat(client: any, data: ChatData) {
    if (!client.auth) {
      return {
        status: 0,
        message: 'Unauthorized',
      };
    }

    const user: Account = client.user;
    const message = data.message;
    const roomAggr = await this.roomsService.findByIdAndMemberIdWithMember(data.room, String(user._id));

    if (roomAggr && roomAggr.length > 0) {
      const room = roomAggr[0];
      const chatMessage = await this.mesageService.create({
        sender: user._id,
        room: room._id,
        message,
      });
      const response = await this.mesageService.findById(chatMessage._id);
      if (!response) {
        return {
          status: 0,
          message: 'Emit fail',
        };
      }
      let responseData = {
        status: 1,
        message: 'Chat message',
        data: new MessageResDto(response, [RoomResDtoOption.join_members]),
      };
      client.broadcast.to(data.room).emit(ChatEvent.chat, responseData);
      this.server.in(String(room._id)).clients(async (e, clients) => {
        // tslint:disable
        if (clients) {
          // clients.forEach(async (cl) => {
          //   const account: Account = await this.authService.fromSocketIdToAccount(cl);
          //   if (String(user._id) !== String(account._id)) {
          //     await this.mesageService.checkAndUpdateMessageStatus(String(account._id), String(room._id));
          //   }
          // });

          const promises = clients.map((client, i) => {
            return this.authService.fromSocketIdToAccount(client)
              .then(account => {
                if (String(user._id) !== String(account._id)) {
                  return this.mesageService.checkAndUpdateMessageStatus(String(account._id), String(room._id));
                }
              });
          });

          await Promise.all(promises);

          room.members.forEach(async (member: Account) => {
            if (String(user._id) !== String(member._id)) {
              let existInRoom = false;
              member.socketIds.forEach(async (sock) => {
                if (!clients.includes(sock)) {
                  const account: Account = await this.authService.fromSocketIdToAccount(sock);
                  const numUnread = await this.mesageService.countMessagesInRoomByStatus(String(room._id), String(account._id));
                  responseData = {
                    ...responseData,
                    data: new MessageResDto(response, [RoomResDtoOption.join_members], message, numUnread),
                  };
                  this.server.to(sock).emit(ChatEvent.chat, responseData);
                } else {
                  existInRoom = true;
                }
              });

              // Tối ưu bằng cách
              const accountDevice = await this.notifyService.findByAccountId(String(member._id));
              if (accountDevice !== null && accountDevice !== undefined && accountDevice.deviceTokens.length > 0 && !existInRoom) {
                const deviceTokens = [];
                accountDevice.deviceTokens.forEach((device: DeviceToken) => {
                  deviceTokens.push(device.token);
                });
                let notificationData;
                if (room.type === RoomType.group) {
                  notificationData = new NotificationData(room.name, (user.name + ': ' + message), String(room._id));
                } else {
                  notificationData = new NotificationData(user.name, message, String(room._id));
                }
                const notificationContent = new NotificationContent(user.name, message);
                const e = await this.notifyService.sendNotifyByToken(deviceTokens, notificationData, notificationContent);
                console.log(e);
              }
            }
          });
        }
      });
      return responseData;
    }
    return {
      status: 0,
      message: 'Not found Room',
    };
  }
}
