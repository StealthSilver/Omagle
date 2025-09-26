// managers/UserManager.ts
import { Socket } from "socket.io";
import { RoomManager } from "./RoomManager";

export interface User {
  socket: Socket;
  name: string;
}

export class UserManager {
  private users: Map<string, User>; // socket.id → User
  private roomManager: RoomManager;

  constructor() {
    this.users = new Map();
    this.roomManager = new RoomManager();
  }

  addUser(name: string, socket: Socket, meetingId?: string) {
    const user: User = { name, socket };
    this.users.set(socket.id, user);

    this.initHandlers(socket);

    if (meetingId) {
      this.roomManager.joinRoom(meetingId, user);
    } else {
      socket.emit("meeting-id", this.roomManager.createRoom(user));
    }
  }

  removeUser(socketId: string) {
    this.users.delete(socketId);
    this.roomManager.removeUser(socketId);
  }

  private initHandlers(socket: Socket) {
    socket.on("offer", ({ sdp, roomId }: { sdp: any; roomId: string }) => {
      this.roomManager.onOffer(roomId, sdp, socket.id);
    });

    socket.on("answer", ({ sdp, roomId }: { sdp: any; roomId: string }) => {
      this.roomManager.onAnswer(roomId, sdp, socket.id);
    });

    socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
      this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
    });
  }
}
