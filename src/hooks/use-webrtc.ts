import { useState, useEffect, useRef, useCallback } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set, push, onDisconnect, remove, off } from 'firebase/database';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Generate a simple unique ID for the user
const userId = Math.random().toString(36).substring(2, 9);

export const useWebRTC = (roomId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const roomRef = useRef(ref(database, `webrtc-rooms/${roomId}`));
  const userRef = useRef(ref(database, `webrtc-rooms/${roomId}/${userId}`));
  const localVideoTrack = useRef<MediaStreamTrack | null>(null);
  const screenShareStream = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    // Stop local camera/mic stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    // Stop screen share stream
    if (screenShareStream.current) {
        screenShareStream.current.getTracks().forEach(track => track.stop());
    }

    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    setLocalStream(null);
    setRemoteStreams({});
    setIsScreenSharing(false);
    localVideoTrack.current = null;
    screenShareStream.current = null;

    if (userRef.current) {
      remove(userRef.current);
    }
    off(roomRef.current);
  }, [localStream]);

  const stopScreenShare = useCallback(async () => {
    // The !isScreenSharing check was removed as it could be stale in the onended callback
    if (!localVideoTrack.current || !localStream) return;
    
    // Stop the screen sharing stream
    screenShareStream.current?.getTracks().forEach(track => track.stop());
    screenShareStream.current = null;

    // Replace track for all peers
    for (const pc of Object.values(peerConnections.current)) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
            await sender.replaceTrack(localVideoTrack.current);
        }
    }

    // Restore local video to show camera
    const newStream = new MediaStream([localVideoTrack.current, ...localStream.getAudioTracks()]);
    setLocalStream(newStream);
    setIsScreenSharing(false);
  }, [localStream]);


  const startScreenShare = useCallback(async () => {
    if (!localStream) return;

    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const screenTrack = screenStream.getVideoTracks()[0];
    
    // Store original camera track if not already stored
    if (!localVideoTrack.current) {
        localVideoTrack.current = localStream.getVideoTracks()[0];
    }

    // Replace track for all peers
    for (const pc of Object.values(peerConnections.current)) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
            await sender.replaceTrack(screenTrack);
        }
    }

    // Update local video to show screen share
    const newStream = new MediaStream([screenTrack, ...localStream.getAudioTracks()]);
    setLocalStream(newStream);

    screenShareStream.current = screenStream;
    setIsScreenSharing(true);
    
    // Listen for when user stops sharing via browser UI
    screenTrack.onended = () => {
        stopScreenShare();
    };

  }, [localStream, stopScreenShare]);
  
  const joinRoom = useCallback(async (stream: MediaStream) => {
    setLocalStream(stream);
    localVideoTrack.current = stream.getVideoTracks()[0];
    
    // Set up cleanup on disconnect
    onDisconnect(userRef.current).remove();

    const otherUsersRef = roomRef.current;
    onValue(otherUsersRef, (snapshot) => {
      const otherUsers: Record<string, any> = snapshot.val() || {};
      const allUserIds = Object.keys(otherUsers);
      
      allUserIds.forEach(otherUserId => {
        if (otherUserId === userId || peerConnections.current[otherUserId]) return;

        // Create a new connection for the new user
        const pc = createPeerConnection(otherUserId, stream);
        peerConnections.current[otherUserId] = pc;
        
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            const offerRef = ref(database, `webrtc-rooms/${roomId}/${otherUserId}/${userId}/offer`);
            set(offerRef, pc.localDescription);
          });
      });

      // Remove connections for users who have left
      const currentPeerIds = Object.keys(peerConnections.current);
      currentPeerIds.forEach(peerId => {
        if (!allUserIds.includes(peerId)) {
          peerConnections.current[peerId].close();
          delete peerConnections.current[peerId];
          setRemoteStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[peerId];
            return newStreams;
          });
        }
      });
    });

    // Listen for offers from other users
    const incomingOffersRef = ref(database, `webrtc-rooms/${roomId}/${userId}`);
    onValue(incomingOffersRef, (snapshot) => {
        const data = snapshot.val() || {};
        Object.keys(data).forEach(otherUserId => {
            if (data[otherUserId].offer && !peerConnections.current[otherUserId]) {
                const pc = createPeerConnection(otherUserId, stream);
                peerConnections.current[otherUserId] = pc;
                pc.setRemoteDescription(new RTCSessionDescription(data[otherUserId].offer))
                    .then(() => pc.createAnswer())
                    .then(answer => pc.setLocalDescription(answer))
                    .then(() => {
                        const answerRef = ref(database, `webrtc-rooms/${roomId}/${otherUserId}/${userId}/answer`);
                        set(answerRef, pc.localDescription);
                    });
            }
            if (data[otherUserId].answer && peerConnections.current[otherUserId]?.signalingState !== 'stable') {
                peerConnections.current[otherUserId]?.setRemoteDescription(new RTCSessionDescription(data[otherUserId].answer));
            }
            if (data[otherUserId].iceCandidates) {
                Object.values(data[otherUserId].iceCandidates).forEach((candidate: any) => {
                    peerConnections.current[otherUserId]?.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("Error adding ICE candidate", e));
                });
            }
        });
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);


  const createPeerConnection = (otherUserId: string, stream: MediaStream): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const iceCandidateRef = push(ref(database, `webrtc-rooms/${roomId}/${otherUserId}/${userId}/iceCandidates`));
        set(iceCandidateRef, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({ ...prev, [otherUserId]: event.streams[0] }));
    };

    return pc;
  };

  const leaveRoom = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    // This effect ensures cleanup happens on component unmount
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { localStream, remoteStreams, joinRoom, leaveRoom, isScreenSharing, startScreenShare, stopScreenShare };
};
