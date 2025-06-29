
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, ScreenShare } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useWebRTC } from '@/hooks/use-webrtc';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const contacts = [
  { id: 1, name: 'Alice', avatar: 'A', online: true },
  { id: 2, name: 'Bob', avatar: 'B', online: true },
  { id: 3, name: 'Charlie', avatar: 'C', online: false },
  { id: 4, name: 'Diana', avatar: 'D', online: true },
];

const ROOM_ID = "global-video-room"; // Single room for simplicity

export default function ContactBook() {
  const [inCall, setInCall] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { localStream, remoteStreams, joinRoom, leaveRoom, isScreenSharing, startScreenShare, stopScreenShare } = useWebRTC(ROOM_ID);

  const handleJoinCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setHasCameraPermission(true);
      joinRoom(stream);
      setInCall(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions to start a video call.',
      });
    }
  }, [joinRoom, toast]);

  const handleLeaveCall = useCallback(() => {
    leaveRoom();
    setInCall(false);
    setIsCameraOn(true);
    setIsMicOn(true);
  }, [leaveRoom]);

  const handleToggleCamera = useCallback(() => {
    if (localStream && !isScreenSharing) { // Can't toggle camera while screen sharing
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn(!isCameraOn);
    }
  }, [localStream, isCameraOn, isScreenSharing]);

  const handleToggleMic = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  }, [localStream, isMicOn]);

  const handleToggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        await stopScreenShare();
        setIsCameraOn(true); // When we stop sharing, camera comes back on
      } else {
        await startScreenShare();
        setIsCameraOn(false); // Can't have camera on while sharing
      }
    } catch (error) {
      console.error("Screen share error:", error);
      toast({
        variant: "destructive",
        title: "Screen Share Failed",
        description: "Could not start screen sharing. Please ensure you have granted permissions.",
      });
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare, toast]);


  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  const isLocalVideoOff = isScreenSharing ? false : !isCameraOn;

  return (
    <div className="flex flex-col h-full">
      {!inCall ? (
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users /> Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{contact.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className={`text-sm ${contact.online ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {contact.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" disabled={!contact.online}>
                    <Video className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Button className="w-full mt-4" onClick={handleJoinCall}>
            <Video className="mr-2 h-5 w-5" /> Start Group Call
          </Button>
        </div>
      ) : (
        <div className="flex flex-col h-full bg-black text-white p-4 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
            {/* Local Video */}
            <div className="relative bg-muted/20 rounded-lg overflow-hidden flex items-center justify-center">
              <video ref={localVideoRef} className={cn("w-full h-full object-cover", isLocalVideoOff && "invisible")} autoPlay muted playsInline />
              {isLocalVideoOff && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                      <VideoOff className="h-16 w-16 text-muted-foreground" />
                      <p className="mt-4 text-lg">Camera is off</p>
                  </div>
              )}
              <p className="absolute bottom-2 left-2 text-sm bg-black/50 px-2 py-1 rounded z-10">{isScreenSharing ? "Your Screen" : "You"}</p>
            </div>
            {/* Remote Videos */}
            {Object.entries(remoteStreams).map(([peerId, stream]) => (
                <div key={peerId} className="relative bg-muted/20 rounded-lg overflow-hidden">
                    <video
                        ref={videoEl => { if (videoEl) videoEl.srcObject = stream; }}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                    />
                     <p className="absolute bottom-2 left-2 text-sm bg-black/50 px-2 py-1 rounded">Guest</p>
                </div>
            ))}
          </div>
          {hasCameraPermission === false && (
            <Alert variant="destructive">
              <VideoOff className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access to participate in the video call. You can still see others.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex justify-center">
            <TooltipProvider>
                <div className="flex justify-center items-center gap-4 p-2 bg-black/50 rounded-full">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={isMicOn ? 'secondary' : 'destructive'}
                                size="icon"
                                className="rounded-full w-14 h-14"
                                onClick={handleToggleMic}
                                aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
                            >
                                {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isMicOn ? 'Mute microphone' : 'Unmute microphone'}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={isCameraOn ? 'secondary' : 'destructive'}
                                size="icon"
                                className="rounded-full w-14 h-14"
                                onClick={handleToggleCamera}
                                aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                                disabled={isScreenSharing}
                            >
                                {isCameraOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                             <p>{isScreenSharing ? "Can't use camera while sharing" : (isCameraOn ? 'Turn off camera' : 'Turn on camera')}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={isScreenSharing ? 'destructive' : 'secondary'}
                                size="icon"
                                className="rounded-full w-14 h-14"
                                onClick={handleToggleScreenShare}
                                aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
                            >
                                <ScreenShare className="h-6 w-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isScreenSharing ? 'Stop sharing screen' : 'Share screen'}</p>
                        </TooltipContent>
                    </Tooltip>

                    <div className="w-px h-8 bg-gray-600 mx-2"></div>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="destructive" 
                                size="icon" 
                                className="rounded-full w-14 h-14" 
                                onClick={handleLeaveCall}
                                aria-label="Leave Call"
                            >
                                <PhoneOff className="h-6 w-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Leave Call</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  );
}
