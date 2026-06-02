import { useState, useEffect } from 'react';
import { Maximize2, Volume2, VolumeX, Video, VideoOff, Camera } from 'lucide-react';

interface LiveCameraProps {
  darkMode: boolean;
}

export default function LiveCamera({ darkMode }: LiveCameraProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const token = localStorage.getItem('masipag_token');
  
  // FIX: Updated to use the exact Cloudflare URL provided
  const streamUrl = token ? "https://name-meat-yet-stage.trycloudflare.com/stream?key=praise-the-fool" : "";

  useEffect(() => {
    const fetchCameraEvents = () => {
      if (!token) return;

      // Secured fetch with JWT Header and 401 
      fetch('https://networkadmin.onrender.com/api/camera-events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then((res) => {
          if (res.status === 401) {
            console.error("Token expired in LiveCamera");
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!data || !Array.isArray(data)) return;

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
    const interval = setInterval(fetchCameraEvents, 15000);
    return () => clearInterval(interval);
  }, [token]);

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
            
            
            {streamUrl ? (
              <img 
                src={streamUrl}
                alt="Live Network Camera Stream"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  document.getElementById('main-cam-error')?.classList.remove('hidden');
                }}
              />
            ) : null}

            {/* Offline Fallback */}
            <div id="main-cam-error" className="hidden absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-0">
              <Camera className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-red-500 font-bold tracking-widest text-lg">CONNECTION LOST</p>
              <p className="text-gray-400 mt-2 text-sm">Waiting for RTSP stream from network switch...</p>
            </div>
            
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 text-xs font-bold tracking-wider">LIVE</span>
            </div>

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
          {events.length === 0 ? (
            <p className={`text-sm italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No camera events recorded.</p>
          ) : (
            events.map((event, index) => (
              <div key={index} className={`p-3 rounded-lg border ${darkMode ? 'bg-[#0f1f35] border-blue-900/30' : 'bg-gray-50 border-gray-200'}`}>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
