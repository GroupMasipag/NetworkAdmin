import cv2

# Target IP from your DHCP static binding
cctv_ip = "192.168.1.55"

print("Starting Ultimate RTSP Credential Scan...")

test_urls = [
    # --- GROUP 1: NO USERNAME & NO PASSWORD (Raw IP Only) ---
    f"rtsp://{cctv_ip}:554/live/ch00_1",  # Standard HD
    f"rtsp://{cctv_ip}:554/live/ch00_0",  # Standard SD
    f"rtsp://{cctv_ip}:554/live/ch01_0",  # Legacy Firmware
    
    # --- GROUP 2: ADMIN & BLANK PASSWORD ---
    f"rtsp://admin:@{cctv_ip}:554/live/ch00_1",
    f"rtsp://admin:@{cctv_ip}:554/live/ch00_0",
    f"rtsp://admin:@{cctv_ip}:554/live/ch01_0",

    # --- GROUP 3: DEVICE ID AS USER & BLANK PASSWORD ---
    f"rtsp://81263707:@{cctv_ip}:554/live/ch00_1",
    f"rtsp://81263707:@{cctv_ip}:554/live/ch00_0",

    # --- GROUP 4: STANDARD ADMIN + STICKER PASSWORD ---
    f"rtsp://admin:5wKJ52V4@{cctv_ip}:554/live/ch00_1",
    f"rtsp://admin:5wKJ52V4@{cctv_ip}:554/live/ch00_0",
    
    # --- GROUP 5: DEVICE ID AS USER + STICKER PASSWORD ---
    f"rtsp://81263707:5wKJ52V4@{cctv_ip}:554/live/ch00_1",
    f"rtsp://81263707:5wKJ52V4@{cctv_ip}:554/live/ch00_0",
    
    # --- GROUP 6: ADMIN + VERIFICATION CODE ---
    f"rtsp://admin:MXWS@{cctv_ip}:554/live/ch00_1"
]

for url in test_urls:
    print(f"\n[TESTING] -> {url}")
    
    # 3-second timeout prevents the script from freezing on bad URLs
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 3000) 
    
    if cap.isOpened():
        print("✅ SUCCESS! The camera accepted this connection.")
        print(">>> COPY THIS EXACT URL INTO YOUR app.py <<<")
        cap.release()
        break
    else:
        print("❌ Connection Refused or Timed Out.")
        
print("\nScan Complete.")