import {Module} from '@nestjs/common';
import {SharedModule} from '../../shared/shared.module';
import {RoomsService} from './rooms.service';
import {TypegooseModule} from 'nestjs-typegoose';
import {Room} from '../../shared/entities/room';
import { RoomsController } from './rooms.controller';
import {RoomGateway} from './room.gateway';
import {AuthService} from '../auth/auth.service';
import {ChatMessage} from '../../shared/entities/chat-message';
import { ChatMessageService } from './chat-message.service';

@Module({
    imports: [
        SharedModule,
        TypegooseModule.forFeature(Room),
        TypegooseModule.forFeature(ChatMessage),
    ],
    providers: [RoomsService, RoomGateway, AuthService, ChatMessageService],
    controllers: [RoomsController],
})
export class RoomsModule {
}
