import { HttpModule, HttpService, Module } from '@nestjs/common';
import {PassportModule} from '@nestjs/passport';
import {JwtModule} from '@nestjs/jwt';
import {JWT_SECRET} from './resources/constants.resource';
import {AuthService} from '../modules/auth/auth.service';
import {JwtStrategy} from '../modules/auth/jwt.strategy';
import {TypegooseModule} from 'nestjs-typegoose';
import {Account} from './entities/account';
import {Room} from './entities/room';
import { NotificationService } from './helpers/notification/notification.service';
import { AccountDevices } from './entities/account-devices';

@Module({
    imports: [
        PassportModule.register({defaultStrategy: 'jwt'}),
        JwtModule.register({
            secret: JWT_SECRET,
            signOptions: {
                expiresIn: '7d',
            },
        }),
        TypegooseModule.forFeature(Account),
        TypegooseModule.forFeature(Room),
        TypegooseModule.forFeature(AccountDevices),
        HttpModule,
    ],
    providers: [
        NotificationService,
        AuthService,
        JwtStrategy,
    ],
    exports: [AuthService, JwtStrategy, NotificationService],
})
export class SharedModule {}
