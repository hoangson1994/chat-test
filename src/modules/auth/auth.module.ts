import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthController } from './auth.controller';
import {SharedModule} from '../../shared/shared.module';
import { DeviceTokenMiddleware } from '../../shared/middlewares/device-token.middleware';

@Module({
    imports: [
        SharedModule,
    ],
    providers: [],
    controllers: [AuthController],
})
export class AuthModule {}
