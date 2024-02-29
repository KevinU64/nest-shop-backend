import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect{

  @WebSocketServer() wss: Server;

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService,
  ) {}
  
  async handleConnection(client: Socket) {
    
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify( token );
      await this.messagesWsService.registerClient( client, payload.id );
    } catch (error) {
      client.disconnect();
      return;
    }



    // console.log('Client connected', client.id);
    // console.log({ conectados: this.messagesWsService.getConnectedClients() });

    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients() );

  }
  
  handleDisconnect(client: Socket) {
    // console.log('Client Disconnected', client.id);
    this.messagesWsService.removeClient( client.id );
    // console.log({ conectados: this.messagesWsService.getConnectedClients() });

    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients() );

  }

  @SubscribeMessage('message-from-client')
  onMessageFromClient( client: Socket, payload: NewMessageDto ) {
    
    //? message-from-server
    //! EMITE UNICAMENTE AL CLIENTE
    // client.emit('messages-from-server', {
    //   fullname: 'Kevin',
    //   message: payload.message || 'no-message!',
    // });

    //! EMITIR A TODOS MENOS AL CLIENTE
    // client.broadcast.emit('messages-from-server', {
    //   fullname: 'Kevin',
    //   message: payload.message || 'no-message!',
    // });

    //! EMITIR A TODOS INCLUYENDO AL CLIENTE
    this.wss.emit('messages-from-server', {
      fullname: this.messagesWsService.getUserFullName(client.id),
      message: payload.message || 'no-message!',
    });

  }



}
