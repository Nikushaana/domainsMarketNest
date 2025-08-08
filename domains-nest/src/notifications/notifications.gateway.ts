import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['https://domains-market-nest.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private onlineUsers = new Map<number, number>();

  @WebSocketServer()
  server: Server;

  handleConnection(socket: Socket) {
    const { role, userId } = socket.handshake.query;
    const userIdInt = parseInt(userId as string, 10);

    if (role === 'admin') {
      socket.join('admin');
      console.log(`Admin joined with socket ID ${socket.id}`);
    }

    if (role === 'user' && !isNaN(userIdInt)) {
      socket.join(`user_${userIdInt}`);
      const count = this.onlineUsers.get(userIdInt) || 0;
      this.onlineUsers.set(userIdInt, count + 1);
      this.server.to('admin').emit('user:connected', userIdInt);
      console.log(`User ${userIdInt} connected.`);
    }
  }

  handleDisconnect(socket: Socket) {
    const { role, userId } = socket.handshake.query;
    const userIdInt = parseInt(userId as string, 10);

    if (role === 'user' && !isNaN(userIdInt)) {
      const count = this.onlineUsers.get(userIdInt) || 1;

      if (count <= 1) {
        this.onlineUsers.delete(userIdInt);
        this.server.to('admin').emit('user:disconnected', userIdInt);
        console.log(`User ${userIdInt} fully disconnected`);
      } else {
        this.onlineUsers.set(userIdInt, count - 1);
        console.log(
          `User ${userIdInt} disconnected one socket. Remaining: ${count - 1}`,
        );
      }
    }
  }

  emitToRoom(room: string, event: string, payload: any) {
    this.server.to(room).emit(event, payload);
  }

  // Public method to retrieve online user IDs
  getOnlineUsers(): number[] {
    return Array.from(this.onlineUsers.keys());
  }

  // Optional: with connection counts
  getOnlineUsersWithCount(): { userId: number; connections: number }[] {
    return Array.from(this.onlineUsers.entries()).map(([userId, count]) => ({
      userId,
      connections: count,
    }));
  }
}
