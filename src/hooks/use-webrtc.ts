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
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const roomRef = useRef(ref(database, `webrtc-rooms/${roomId}`));
  const userRef = useRef(ref(database, `webrtc-rooms/${roomId}/${userId}`));

  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    setLocalStream(null);
    setRemoteStreams({});
    if (userRef.current) {
        remove(userRef.current);
    }
    off(roomRef.current);
  }, [localStream]);
  
  const joinRoom = useCallback(async (stream: MediaStream) => {
    setLocalStream(stream);
    
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
                    peerConnections.current[otherUserId]?.addIceCandidate(new RTCIceCandidate(candidate));
                });
            }
        });
    });

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

  return { localStream, remoteStreams, joinRoom, leaveRoom };
};
