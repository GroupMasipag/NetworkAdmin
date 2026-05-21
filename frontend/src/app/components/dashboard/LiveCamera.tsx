import { useState, useEffect, useRef } from 'react';
import { Maximize2, Volume2, VolumeX, Video, VideoOff } from 'lucide-react';

interface LiveCameraProps {
  darkMode: boolean;
}

export default function LiveCamera({ darkMode }: LiveCameraProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  // 1. Create a blank state to hold the live database camera events
  const [events, setEvents] = useState<any[]>([]);

  // 2. Create a reference to attach the video stream to
  const videoRef = useRef<HTMLVideoElement>(null);

  // 3. The Webcam Activation Hook
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Ask the browser for webcam access
        currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        console.error("Camera access denied or unavailable:", err);
      }
    };

    startCamera();

    // Cleanup function: Turn off the webcam light when leaving the page
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 4. The Link: Fetch the data from your live Python Bouncer on Render
  useEffect(() => {
    const fetchCameraEvents = () => {
      fetch('https://networkadmin.onrender.com/api/camera-events')
        .then((res) => res.json())
        .then((data) => {
          // Translate Python's database columns into React's UI format
          const liveData = data.map((item: any) => ({
            time: new Date(item.timestamp).toLocaleTimeString(),
            camera: item.camera_id,
            event: item.event_description,
            severity: item.severity.toLowerCase()
          }));
          
          setEvents(liveData);
        })
        .catch((err) => console.error("Database Connection Failed:", err));
    };

    fetchCameraEvents();
    
    // Refresh the camera events every 15 seconds
    const interval = setInterval(fetchCameraEvents, 15000);
    return () => clearInterval(interval);
  }, []);

  const camera = {
    name: 'CAM-01 - Main Entrance',
    location: 'Building A - Front',
    status: 'online'
  };
  
  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1a2942] border border-blue-900/30' : 'bg-white border border-gray-200'}`}>
        <h2 className={`text-2xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Live Security Camera Feed
        </h2>

        <div className="max-w-4xl mx-auto">
          <div className={`relative aspect-video rounded-lg overflow-hidden ${darkMode ? 'bg-[#0f1f35]' : 'bg-gray-900'}`}>
            
            {/* The Live Webcam Stream */}
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Keeping the LIVE pulse badge in the top right corner for aesthetics */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 text-xs font-bold tracking-wider">LIVE</span>
            </div>

            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

            <div className="absolute top-4 left-4 flex items-start justify-between z-10">
              <div>
                <div className={`px-3 py-1.5 rounded ${darkMode ? 'bg-black/60' : 'bg-black/70'}`}>
                  <p className="text-white text-sm font-mono">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute top-4 right-24 flex gap-2 z-10">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded bg-black/60 hover:bg-black/80 text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button className="p-2 rounded bg-black/60 hover:bg-black/80 text-white transition-colors">
                  <Maximize2 className="w-5 h-5" />
                </button>
            </div>

            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="flex items-center justify-between">
                <div className={`px-3 py-1.5 rounded ${darkMode ? 'bg-black/60' : 'bg-black/70'}`}>
                  <p className="text-white text-sm">
                    {camera.name} • {camera.location}
                  </p>
                </div>
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded transition-colors ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-black/60 hover:bg-black/80 text-white'
                  }`}
                >
                  {isRecording ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  <span className="text-sm">
                    {isRecording ? 'Recording' : 'Record'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1a2942] border border-blue-900/30' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-lg mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Recent Events
        </h3>
        <div className="space-y-3">
          {events.map((event, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${darkMode ? 'bg-[#0f1f35] border-blue-900/30' : 'bg-gray-50 border-gray-200'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                  event.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {event.time}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {event.camera}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {event.event}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}