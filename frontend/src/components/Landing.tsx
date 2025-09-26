// components/Landing.tsx

import { useEffect, useRef, useState } from "react";
import { Room } from "./Room";

export const Landing = () => {
  const [name, setName] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [localAudioTrack, setLocalAudioTrack] =
    useState<MediaStreamTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<MediaStreamTrack | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [joined, setJoined] = useState(false);

  const getCam = async () => {
    const stream = await window.navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalAudioTrack(stream.getAudioTracks()[0]);
    setLocalVideoTrack(stream.getVideoTracks()[0]);
    if (videoRef.current) {
      videoRef.current.srcObject = new MediaStream([
        stream.getVideoTracks()[0],
      ]);
      videoRef.current.play();
    }
  };

  useEffect(() => {
    getCam();
  }, []);

  if (!joined) {
    return (
      <div className="flex flex-col items-center p-8 space-y-4">
        <video
          autoPlay
          ref={videoRef}
          className="rounded-lg shadow-lg w-64 h-48"
        />
        <input
          type="text"
          placeholder="Enter your name"
          className="border rounded p-2"
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={() => {
            setMeetingId(""); // create new meeting
            setJoined(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Create Meeting
        </button>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter Meeting ID"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            className="border rounded p-2"
          />
          <button
            onClick={() => setJoined(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Join Meeting
          </button>
        </div>
      </div>
    );
  }

  return (
    <Room
      name={name}
      meetingId={meetingId}
      localAudioTrack={localAudioTrack}
      localVideoTrack={localVideoTrack}
    />
  );
};
