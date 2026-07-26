import "@livekit/components-styles";
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

interface VideoConferenceRoomProps {
  trainingId: string;
}

export function VideoConferenceRoom({ trainingId }: VideoConferenceRoomProps) {
  const [token, setToken] = useState<string>("");
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await apiClient.post("/api/video/token", { trainingId });
        setToken(res.data.token);
      } catch (e) {
        console.error("Failed to fetch LiveKit token", e);
      }
    }
    fetchToken();
  }, [trainingId]);

  if (token === "") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-white rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem", overflow: "hidden" }}
    >
      <VideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
