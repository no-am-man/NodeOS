"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, PhoneOff, Users } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useWebRTC } from '@/hooks/use-webrtc';

const contacts = [
  { id: 1, name: 'Alice', avatar: 'A', online: true },
  { id: 2, name: 'Bob', avatar: 'B', online: true },
  { id: 3, name: 'Charlie', avatar: 'C', online: false },
  { id: 4, name: 'Diana', avatar: 'D', online: true },
];

const ROOM_ID = "global-video-room"; // Single room for simplicity

export default function ContactBook() {
  const [inCall, setInCall] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { localStream, remoteStreams, joinRoom, leaveRoom } = useWebRTC(ROOM_ID);

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
  }, [leaveRoom]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

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
            <div className="relative bg-muted/20 rounded-lg overflow-hidden">
                <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <p className="absolute bottom-2 left-2 text-sm bg-black/50 px-2 py-1 rounded">You</p>
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
            <Button variant="destructive" size="lg" className="rounded-full" onClick={handleLeaveCall}>
              <PhoneOff className="mr-2 h-5 w-5" /> Leave Call
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
