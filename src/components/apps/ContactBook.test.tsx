
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ContactBook from '@/components/apps/ContactBook';
import { useWebRTC } from '@/hooks/use-webrtc';
import { useToast } from '@/hooks/use-toast';

// Mock the useWebRTC hook
vi.mock('@/hooks/use-webrtc');
const mockUseWebRTC = useWebRTC as vi.Mock;

// Mock the useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock MediaStream
class MockMediaStream {
  getTracks() {
    return [{
      stop: vi.fn(),
      enabled: true,
      kind: 'video' as const,
      onended: () => {},
    }, {
      stop: vi.fn(),
      enabled: true,
      kind: 'audio' as const,
    }];
  }
  getVideoTracks() { return this.getTracks().filter(t => t.kind === 'video'); }
  getAudioTracks() { return this.getTracks().filter(t => t.kind === 'audio'); }
}
global.MediaStream = MockMediaStream as any;


describe('ContactBook Component (UI Test)', () => {
  const mockJoinRoom = vi.fn();
  const mockLeaveRoom = vi.fn();
  const mockStartScreenShare = vi.fn();
  const mockStopScreenShare = vi.fn();
  let mockLocalStream: MediaStream | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStream = new MockMediaStream() as MediaStream;
    
    mockUseWebRTC.mockReturnValue({
      localStream: null,
      remoteStreams: {},
      isScreenSharing: false,
      joinRoom: mockJoinRoom,
      leaveRoom: mockLeaveRoom,
      startScreenShare: mockStartScreenShare,
      stopScreenShare: mockStopScreenShare,
    });

    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: {
            getUserMedia: vi.fn().mockResolvedValue(mockLocalStream),
            getDisplayMedia: vi.fn().mockResolvedValue(mockLocalStream),
        },
    });
  });

  it('should render the contact list initially', () => {
    render(<ContactBook />);
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Group Call/i })).toBeInTheDocument();
  });

  it('should join a call when "Start Group Call" is clicked', async () => {
    const { rerender } = render(<ContactBook />);
    const joinButton = screen.getByRole('button', { name: /Start Group Call/i });
    
    await act(async () => {
        fireEvent.click(joinButton);
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ video: true, audio: true });
    expect(mockJoinRoom).toHaveBeenCalledWith(mockLocalStream);
    
    // Rerender with state updated as if in a call
    mockUseWebRTC.mockReturnValue({
        localStream: mockLocalStream,
        remoteStreams: {},
        isScreenSharing: false,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        startScreenShare: mockStartScreenShare,
        stopScreenShare: mockStopScreenShare,
    });
    rerender(<ContactBook />);
    expect(screen.getByLabelText(/Leave Call/i)).toBeInTheDocument();
  });

  it('should show the in-call UI after joining', async () => {
    mockUseWebRTC.mockReturnValue({
        localStream: mockLocalStream,
        remoteStreams: {},
        isScreenSharing: false,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        startScreenShare: mockStartScreenShare,
        stopScreenShare: mockStopScreenShare,
      });

    render(<ContactBook />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByLabelText(/Leave Call/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mute microphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Turn off camera/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Share screen/i)).toBeInTheDocument();
  });

  it('should toggle mute and camera', async () => {
    const localStreamInstance = new MockMediaStream();
    mockUseWebRTC.mockReturnValue({
        localStream: localStreamInstance as unknown as MediaStream,
        remoteStreams: {},
        isScreenSharing: false,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        startScreenShare: mockStartScreenShare,
        stopScreenShare: mockStopScreenShare,
      });

    const { rerender } = render(<ContactBook />);

    const muteButton = screen.getByLabelText(/Mute microphone/i);
    const cameraButton = screen.getByLabelText(/Turn off camera/i);

    // Toggle Mic
    await act(async () => {
        fireEvent.click(muteButton);
    });
    rerender(<ContactBook />);
    expect(localStreamInstance.getAudioTracks()[0].enabled).toBe(false); // mic off
    expect(screen.getByLabelText(/Unmute microphone/i)).toBeInTheDocument();

    // Toggle Camera
    await act(async () => {
        fireEvent.click(cameraButton);
    });
    rerender(<ContactBook />);
    expect(localStreamInstance.getVideoTracks()[0].enabled).toBe(false); // camera off
    expect(screen.getByLabelText(/Turn on camera/i)).toBeInTheDocument();
  });


  it('should toggle screen sharing', async () => {
    mockUseWebRTC.mockReturnValue({
        localStream: mockLocalStream,
        remoteStreams: {},
        isScreenSharing: false,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        startScreenShare: mockStartScreenShare,
        stopScreenShare: mockStopScreenShare,
      });
    const { rerender } = render(<ContactBook />);
    
    const screenShareButton = screen.getByLabelText(/Share screen/i);
    await act(async () => {
        fireEvent.click(screenShareButton);
    });
    expect(mockStartScreenShare).toHaveBeenCalled();

    // Re-render with screen sharing active
    mockUseWebRTC.mockReturnValue({
        localStream: mockLocalStream,
        remoteStreams: {},
        isScreenSharing: true,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        startScreenShare: mockStartScreenShare,
        stopScreenShare: mockStopScreenShare,
      });
    rerender(<ContactBook />);
    
    const stopScreenShareButton = screen.getByLabelText(/Stop sharing screen/i);
    await act(async () => {
        fireEvent.click(stopScreenShareButton);
    });
    expect(mockStopScreenShare).toHaveBeenCalled();
  });

  it('should leave the call when leave button is clicked', async () => {
    mockUseWebRTC.mockReturnValue({
        localStream: mockLocalStream,
        remoteStreams: {},
        isScreenSharing: false,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        startScreenShare: mockStartScreenShare,
        stopScreenShare: mockStopScreenShare,
    });
    render(<ContactBook />);

    const leaveButton = screen.getByLabelText(/Leave Call/i);
    await act(async() => {
        fireEvent.click(leaveButton);
    });
    expect(mockLeaveRoom).toHaveBeenCalled();
  });

  it('should display remote streams when they are available', () => {
    mockUseWebRTC.mockReturnValue({
      localStream: mockLocalStream,
      remoteStreams: {
        'peer-123': new MockMediaStream() as MediaStream,
      },
      isScreenSharing: false,
      joinRoom: mockJoinRoom,
      leaveRoom: mockLeaveRoom,
      startScreenShare: mockStartScreenShare,
      stopScreenShare: mockStopScreenShare,
    });

    render(<ContactBook />);
    expect(screen.getByText('Guest')).toBeInTheDocument();
  });

});
