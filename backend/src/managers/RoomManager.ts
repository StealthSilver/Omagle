// managers/RoomManager.ts
import { User } from "./UserManager";

interface Room {
  id: string;
  participants: User[];
}

export class RoomManager {
  private rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map();
  }

  createRoom(user: User): string {
    const roomId = Math.random().toString(36).substring(2, 8);
    this.rooms.set(roomId, { id: roomId, participants: [user] });
    return roomId;
  }

  joinRoom(roomId: string, user: User) {
    const room = this.rooms.get(roomId);
    if (!room) {
      user.socket.emit("error", { message: "Room not found" });
      return;
    }

    room.participants.push(user);

    // Notify both users
    room.participants.forEach((u) => u.socket.emit("send-offer", { roomId }));
  }

  removeUser(socketId: string) {
    for (const [roomId, room] of this.rooms) {
      room.participants = room.participants.filter(
        (u) => u.socket.id !== socketId
      );
      if (room.participants.length === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  onOffer(roomId: string, sdp: any, senderId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.participants
      .filter((u) => u.socket.id !== senderId)
      .forEach((u) => u.socket.emit("offer", { sdp, roomId }));
  }

  onAnswer(roomId: string, sdp: any, senderId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.participants
      .filter((u) => u.socket.id !== senderId)
      .forEach((u) => u.socket.emit("answer", { sdp, roomId }));
  }

  onIceCandidates(
    roomId: string,
    senderId: string,
    candidate: any,
    type: string
  ) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.participants
      .filter((u) => u.socket.id !== senderId)
      .forEach((u) => u.socket.emit("add-ice-candidate", { candidate, type }));
  }
}
