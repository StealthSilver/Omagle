// components/Room.tsx

import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";

const URL = "http://localhost:3000";

export const Room = ({
  name,
  meetingId,
  localAudioTrack,
  localVideoTrack,
}: {
  name: string;
  meetingId: string;
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sendingPc, setSendingPc] = useState<RTCPeerConnection | null>(null);
  const [receivingPc, setReceivingPc] = useState<RTCPeerConnection | null>(
    null
  );
  const [roomId, setRoomId] = useState<string>("");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const remoteStreamRef = useRef<MediaStream>(new MediaStream());

  // --- Setup socket and signaling ---
  useEffect(() => {
    const socket = io(URL);
    setSocket(socket);

    socket.emit("join", { name, meetingId });

    socket.on("meeting-id", (id: string) => {
      setRoomId(id);
    });

    socket.on("send-offer", async ({ roomId }) => {
      setRoomId(roomId);

      const pc = new RTCPeerConnection();
      setSendingPc(pc);

      // Add local video/audio tracks
      if (localVideoTrack) pc.addTrack(localVideoTrack);
      if (localAudioTrack) pc.addTrack(localAudioTrack);

      // Attach remote tracks
      pc.ontrack = (e) => {
        e.streams[0].getTracks().forEach((track) => {
          remoteStreamRef.current.addTrack(track);
        });
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          remoteVideoRef.current.play();
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "sender",
            roomId,
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        const sdp = await pc.createOffer();
        await pc.setLocalDescription(sdp);
        socket.emit("offer", { sdp, roomId });
      };
    });

    socket.on("offer", async ({ roomId, sdp }) => {
      setRoomId(roomId);

      const pc = new RTCPeerConnection();
      setReceivingPc(pc);

      await pc.setRemoteDescription(sdp);

      if (localVideoTrack) pc.addTrack(localVideoTrack);
      if (localAudioTrack) pc.addTrack(localAudioTrack);

      pc.ontrack = (e) => {
        e.streams[0].getTracks().forEach((track) => {
          remoteStreamRef.current.addTrack(track);
        });
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          remoteVideoRef.current.play();
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "receiver",
            roomId,
          });
        }
      };

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", { roomId, sdp: answer });
    });

    socket.on("answer", ({ roomId, sdp }) => {
      setSendingPc((pc) => {
        pc?.setRemoteDescription(sdp);
        return pc;
      });
    });

    socket.on("add-ice-candidate", ({ candidate, type }) => {
      if (type === "sender") {
        setReceivingPc((pc) => {
          pc?.addIceCandidate(candidate);
          return pc;
        });
      } else {
        setSendingPc((pc) => {
          pc?.addIceCandidate(candidate);
          return pc;
        });
      }
    });

    socket.on("error", ({ message }) => {
      alert(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [name, meetingId, localAudioTrack, localVideoTrack]);

  // --- Local video preview ---
  useEffect(() => {
    if (localVideoRef.current && localVideoTrack) {
      localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
      localVideoRef.current.play();
    }
  }, [localVideoTrack]);

  return (
    <div className="flex flex-col items-center p-6 space-y-6">
      <h1 className="text-2xl font-bold">Hello {name}</h1>

      {roomId && (
        <div className="p-3 bg-gray-100 border rounded-lg">
          Meeting ID: <span className="font-mono">{roomId}</span>
        </div>
      )}

      <div className="flex space-x-4">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="rounded-lg shadow-md w-64 h-48 border bg-black"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="rounded-lg shadow-md w-64 h-48 border bg-black"
        />
      </div>
    </div>
  );
};
