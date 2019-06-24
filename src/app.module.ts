import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {SocketGatewayModule} from './modules/socket-gateway/socket-gateway.module';
import {AuthModule} from './modules/auth/auth.module';
import {SharedModule} from './shared/shared.module';
import {TypegooseModule} from 'nestjs-typegoose';
import { RoomsModule } from './modules/rooms/rooms.module';
import { DeviceTokenMiddleware } from './shared/middlewares/device-token.middleware';

@Module({
    imports: [
        TypegooseModule.forRoot('mongodb://localhost:27017/chat', {useNewUrlParser: true}),
        SocketGatewayModule,
        AuthModule,
        SharedModule,
        RoomsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
        consumer
          .apply(DeviceTokenMiddleware)
          .forRoutes(
            { path: 'auth/login', method: RequestMethod.POST },
            { path: 'auth/user-data', method: RequestMethod.GET },
            { path: 'auth/register', method: RequestMethod.POST },
            );
    }
}
