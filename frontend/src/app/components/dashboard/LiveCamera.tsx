import { useState, useEffect } from 'react';
import { Camera, Maximize2, Volume2, VolumeX, Video, VideoOff } from 'lucide-react';

interface LiveCameraProps {
  darkMode: boolean;
}

export default function LiveCamera({ darkMode }: LiveCameraProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  // 1. Create a blank state to hold the live database camera events
  const [events, setEvents] = useState<any[]>([]);

  // 2. The Link: Fetch the data from Python
  useEffect(() => {
    const fetchCameraEvents = () => {
      fetch('https://networkadmin.onrender.com/api/camera-events')
        .then((res) => res.json())
        .then((data) => {
          // 3. Translate Python's database columns into React's UI format
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
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-xl">{camera.name}</p>
                <p className="text-gray-500 text-sm mt-2">{camera.location}</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-500 text-sm font-medium">LIVE</span>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

            <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
              <div>
                <div className={`px-3 py-1.5 rounded ${darkMode ? 'bg-black/60' : 'bg-black/70'}`}>
                  <p className="text-white text-sm font-mono">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
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
            </div>

            <div className="absolute bottom-4 left-4 right-4">
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