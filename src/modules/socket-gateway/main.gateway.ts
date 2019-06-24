import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import {from, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Client, Server} from 'socket.io';

@WebSocketGateway({namespace: 'a'})
export class MainGateWay implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;

    @SubscribeMessage('events')
    findAll(client: Client, data: any): Observable<WsResponse<number>> {
        return from([1, 2, 3]).pipe(map(item => ({event: 'events', data: item})));
    }

    @SubscribeMessage('identity')
    async identity(client: Client, data: number): Promise<number> {
        return data;
    }

    handleConnection(client: any, ...args: any[]) {
        console.log('connecting', client.id);
    }

    handleDisconnect(client: Client) {
        console.log('disconnecting', client.id);
    }
}
