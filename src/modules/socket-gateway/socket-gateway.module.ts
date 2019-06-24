import { Module } from '@nestjs/common';
import { MainGateWay } from './main.gateway';

@Module({
    providers: [MainGateWay],
})
export class SocketGatewayModule {}
