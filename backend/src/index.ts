// index.ts

import express from "express";
import http from "http";
import { Server } from "socket.io";
import { UserManager } from "./managers/UserManager";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const userManager = new UserManager();

io.on("connection", (socket) => {
  console.log(`a user connected: ${socket.id}`);

  socket.on(
    "join",
    ({ name, meetingId }: { name: string; meetingId?: string }) => {
      if (!name) name = "anonymous";
      userManager.addUser(name, socket, meetingId);
      // You may echo back the user has joined here if needed
    }
  );

  socket.on("disconnect", () => {
    console.log(`user disconnected: ${socket.id}`);
    userManager.removeUser(socket.id);
  });
});

server.listen(3000, () => {
  console.log("listening on 3000");
});
