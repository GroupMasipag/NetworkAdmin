import os
import cv2
import threading
import time
import psycopg2
import psycopg2.extras
import psutil
from flask import Flask, render_template, jsonify, request
from dotenv import load_dotenv
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

# 1. INITIAL SETUP
load_dotenv() 
app = Flask(__name__)
CORS(app, resources={r"/api/*": {
    "origins": [
        "http://localhost:5173", # Local development URL for React frontend
        "https://networkadministrationgroup6.onrender.com" # Production URL for React frontend
    ]}}) # Allows frontend to talk to backend

limiter = Limiter(
    get_remote_address, 
    app=app, 
    storage_uri="memory://",
    default_limits=["200 per minute"]
    ) # Basic rate limiting to prevent abuse; can be adjusted as needed

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
jwt = JWTManager(app)
#jwt and database url is in the .env file 
def get_db_connection():
    try:
        return psycopg2.connect(os.getenv("DATABASE_URL"))
    except Exception as e:
        print(f" DATABASE ERROR: {e}")
        return None

# 2. DETECTION MECHANIC
def network_scanner():
    print(">>> [SYSTEM] Hardware Network Monitor Initialized...")
    # Take an initial snapshot of the network card
    last_io = psutil.net_io_counters()

    DDOS_THRESHOLD_PPS = 800  # Packets per second limit
    last_ddos_alert_time = 0  # Tracks the 60-second cooldown

    while True:
        # Wait 2 seconds
        time.sleep(2)  
        
        # Take a new snapshot
        current_io = psutil.net_io_counters()

        # Calculate bytes moving across the physical network over the last 2 seconds
        bytes_sent = current_io.bytes_sent - last_io.bytes_sent
        bytes_recv = current_io.bytes_recv - last_io.bytes_recv
        total_bytes_per_sec = (bytes_sent + bytes_recv) / 2

        # Convert raw bytes to Mbps (Megabits per second)
        bandwidth_mbps = (total_bytes_per_sec * 8) / 1_000_000

        # Calculate real packet flow
        packets_sent = current_io.packets_sent - last_io.packets_sent
        packets_recv = current_io.packets_recv - last_io.packets_recv
        packets_per_sec = (packets_sent + packets_recv) / 2

        # Save this snapshot for the next loop's math
        last_io = current_io 

        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                # Find out how many real threats are currently active
                cursor.execute("SELECT COUNT(*) FROM threats WHERE status = 'active'")
                active_threats = cursor.fetchone()[0]

                # real data to log into the database for the traffic graph and system status
                cursor.execute(
                    """INSERT INTO network_traffic (requests_per_sec, active_threats, bandwidth_mbps, packets) 
                       VALUES (%s, %s, %s, %s)""",
                    (int(packets_per_sec), active_threats, round(bandwidth_mbps, 2), int(packets_per_sec))
                )

                # Threshold detector for DDoS attempts
                if packets_per_sec > DDOS_THRESHOLD_PPS:
                    current_time = time.time()
                    
                    # Only trigger if the 60-second cooldown has passed
                    if current_time - last_ddos_alert_time > 60:
                        
                        # Log to the Security Alerts Table
                        cursor.execute(
                            "INSERT INTO threats (ip, attack_type, severity, description) VALUES (%s, %s, %s, %s)",
                            ('Multiple IPs (Volumetric)', 'DDoS Attempt', 'High', f'Traffic spike detected: {int(packets_per_sec)} pps (Threshold: {DDOS_THRESHOLD_PPS})')
                        )
                        
                        # Log to the System Logs
                        cursor.execute(
                            "INSERT INTO system_logs (level, category, message, source) VALUES (%s, %s, %s, %s)",
                            ('CRITICAL', 'Network', f'DDoS traffic spike detected — {int(packets_per_sec)} req/s (threshold: {DDOS_THRESHOLD_PPS})', 'Traffic Monitor')
                        )
                        
                        print(f"🚨 [DDOS ALERT] Volumetric threshold exceeded: {int(packets_per_sec)} pps!")
                        last_ddos_alert_time = current_time # Reset the cooldown timer
            
                conn.commit()
                cursor.close()
                conn.close()
            except Exception as e:
                print(f"Hardware Monitor Error: {e}")

# 3. START THE SCANNER THREAD
threading.Thread(target=network_scanner, daemon=True).start()

def generate_camera_frames():
    # THIS WILL BE CHANGED DURING PHSYICAL LIVE DEMO
    # SETUP FOR THE PC ( LOCAL OR WEB ) ->  ROUTER -> SWITCH -> CCTV CAMERA
    # Option A: If using an IP Camera via your Cisco Router/Switch network topology:
    # THIS IS THE TYPICAL URL FORMAT FOR CAMERA: "rtsp://admin:password@CAMERA_IP_ADDRESS:554/stream1"
    # camera_source = "rtsp://admin:password@192.168.1.100:554/stream1"
    
    # Option B: If testing locally with a USB webcam / Capture card interface:
    # just turn into a comment if needed is the IP camera ( for local development )

    # rtsp://<CAMERA_IP>:554/live/ch00_1 or rtsp://<CAMERA_IP>/live/ch00_0. 
    # enable ONVIF or RTSP inside the V380 Pro mobile app
    camera_source = 0 
    
    camera = cv2.VideoCapture(camera_source)
    
    # Set resolution limits to prevent overloading your Render server bandwidth
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    if not camera.isOpened():
        print("❌ [CAMERA ERROR] Could not connect to physical CCTV source.")
        return

    print("🔌 [CAMERA] Successfully established connection to physical CCTV source.")

    while True:
        success, frame = camera.read()
        if not success:
            # If a frame fails, inject a slight delay and retry connection
            cv2.waitKey(30)
            continue
        else:
            # OPTIONAL: Add a professional "LIVE" timestamp overlay onto the video stream
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cv2.putText(frame, f"CCTV LIVE - {timestamp}", (10, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

            # Encode the frame into standard JPEG format
            ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.imwrite_jpeg_quality), 75])
            if not ret:
                continue
                
            frame_bytes = buffer.tobytes()
            
            # Use multipart boundary packaging to stream frame-by-frame continuously
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    camera.release()

# 4. API ROUTES

# This route serves the live video stream to the frontend 
# it uses the generator function to continuously capture frames from the physical CCTV camera and stream them in real time to the React dashboard, 
# where they will be displayed in the Physical Security section. The use of multipart/x-mixed-replace allows for efficient streaming of JPEG frames without needing to reload the entire page, providing a smooth live video experience for admins monitoring the feed.
@app.route('/api/camera/stream')
def video_feed():
    return Response(generate_camera_frames(), 
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# The login route is the critical point where we will implement the detection of unauthorized access attempts, 
# log them as real threats in the database, and also log them in the system logs for comprehensive monitoring. We will also implement rate limiting to prevent brute-force attacks.
@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    incoming_data = request.get_json()
    username = incoming_data.get('username')
    password = incoming_data.get('password')

    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # 1. Fetch the user's saved (and pre-hashed) password from the DB
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        # 2. Check if the user exists AND if the password matches the hash
        if user and check_password_hash(user['password_hash'], password):
            
            # 3. Create the token
            access_token = create_access_token(identity=username)
            
            cursor.execute(
                "INSERT INTO app_usage (username, user_ip, action) VALUES (%s, %s, %s)",
                (username, request.remote_addr, 'Successful Login')
            )
            conn.commit()
            
            cursor.close()
            conn.close()
            return jsonify({"token": access_token, "message": "Login successful"}), 200
            
        cursor.close()
        conn.close()

    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        attacker_ip = request.remote_addr
        
        # 1. Log this real event to the Threats table!
        cursor.execute(
            "INSERT INTO threats (ip, attack_type, severity, description) VALUES (%s, %s, %s, %s)",
            (attacker_ip, 'Unauthorized Login Attempt', 'High', f'Failed authentication attempt targeting username: {username}')
        )
        
        # 2. Log it to the System Logs table as a security warning!
        cursor.execute(
            "INSERT INTO system_logs (level, category, message, source) VALUES (%s, %s, %s, %s)",
            ('WARN', 'Security', f'Failed login attempt from {attacker_ip}', 'Auth Server')
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        print(f"🚨 [SECURITY] Failed login logged as threat from IP: {attacker_ip}")

    # Return the generic error to the attacker
    return jsonify({"error": "Invalid username or password"}), 401

# This route allows the frontend to fetch the most recent threats to display in the Threats Table on the dashboard - 
# it pulls real data from the database so that when you test the login route with incorrect credentials, you will see those attempts show up here as real threats that you can then mitigate!
@app.route('/api/threats', methods=['GET'])
@jwt_required()
def get_threats():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cursor.execute("SELECT * FROM threats WHERE status != 'mitigated' ORDER BY timestamp DESC LIMIT 50")
            threats = cursor.fetchall()
            cursor.close()
            conn.close()
            return jsonify(threats)
        except Exception as e:
            print(f"Threat Fetch Error: {e}")
            return jsonify({"error": "Failed to fetch threats"}), 500
    return jsonify({"error": "Database connection failed"}), 500

# This is the critical route that allows admins to mitigate threats directly from the dashboard - 
# it updates the threat status, logs the action in both the System Logs and the User Audit Trail, and identifies which admin took the action based on their JWT token and IP address
@app.route('/api/threats/<int:threat_id>/mitigate', methods=['POST'])
@jwt_required()
def mitigate_threat(threat_id):
    # Identify which admin is pushing the button
    current_user = get_jwt_identity()
    admin_ip = request.remote_addr
    
    # Get the specific action the admin chose (e.g., "Block Suspicious IPs")
    data = request.get_json() or {}
    action_taken = data.get('action', 'Applied standard mitigation')

    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            
            # 1. Mark the threat as 'mitigated' so it disappears from the active table
            cursor.execute(
                "UPDATE threats SET status = 'mitigated' WHERE id = %s RETURNING ip, attack_type", 
                (threat_id,)
            )
            threat_data = cursor.fetchone()
            
            if threat_data:
                threat_ip = threat_data[0]
                
                # 2. Add an entry to the System Logs
                cursor.execute(
                    "INSERT INTO system_logs (level, category, message, source) VALUES (%s, %s, %s, %s)",
                    ('INFO', 'Security', f"Admin '{current_user}' executed '{action_taken}' against IP {threat_ip}", 'Mitigation Console')
                )

                # 3. Add an entry to the strict User Audit Trail (Rubric Requirement!)
                cursor.execute(
                    "INSERT INTO app_usage (username, user_ip, action) VALUES (%s, %s, %s)",
                    (current_user, admin_ip, f"Mitigated Threat #{threat_id}: {action_taken}")
                )

                conn.commit()
                cursor.close()
                conn.close()
                return jsonify({"message": "Threat successfully mitigated"}), 200
            else:
                cursor.close()
                conn.close()
                return jsonify({"error": "Threat not found"}), 404

        except Exception as e:
            print(f"Mitigation Error: {e}")
            return jsonify({"error": "Database error during mitigation"}), 500

    return jsonify({"error": "Database connection failed"}), 500

# This route allows the frontend to fetch live system logs related to a specific threat when an admin clicks on the "View Logs" button for that threat - it identifies the IP of the threat, pulls relevant logs from the database that mention that IP, and formats them specifically for the React Terminal UI to display in a real-time log viewer modal. This provides admins with critical context about what is happening with that threat in real time, directly from the dashboard.
@app.route('/api/logs/live', methods=['GET'])
@jwt_required()
def get_live_logs():
    alert_id = request.args.get('alert_id')
    conn = get_db_connection()
    
    if conn:
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # 1. Find the IP of the attacker to get their specific logs
            cursor.execute("SELECT ip FROM threats WHERE id = %s", (alert_id,))
            threat = cursor.fetchone()
            
            if threat:
                threat_ip = threat['ip']
                # Get system logs involving this specific IP
                cursor.execute(
                    "SELECT timestamp, level, message FROM system_logs WHERE message LIKE %s ORDER BY timestamp DESC LIMIT 8", 
                    (f"%{threat_ip}%",)
                )
            else:
                # Fallback if specific IP logs aren't found
                cursor.execute("SELECT timestamp, level, message FROM system_logs ORDER BY timestamp DESC LIMIT 8")
                
            raw_logs = cursor.fetchall()
            cursor.close()
            conn.close()

            # 2. Format specifically for the React Terminal UI
            formatted_logs = []
            for row in reversed(raw_logs): # Reverse so the newest log is at the bottom of the terminal!
                formatted_logs.append({
                    "ts": row['timestamp'].strftime("%H:%M:%S"),
                    "level": row['level'].upper() if row['level'] else "INFO",
                    "msg": row['message']
                })
            
            return jsonify({"logs": formatted_logs})
        except Exception as e:
            print(f"Live Log Error: {e}")
            return jsonify({"error": "Failed to fetch live logs"}), 500
            
    return jsonify({"error": "Database connection failed"}), 500

# This route allows admins to view the User Audit Trail, which logs all significant actions taken by users (especially admins) in the system, 
# along with their IP addresses and timestamps. This is a critical component for accountability and monitoring of admin activities.
@app.route('/api/audit-trail', methods=['GET'])
@jwt_required()
def get_audit_trail():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT username, user_ip, action, timestamp FROM app_usage ORDER BY timestamp DESC LIMIT 50")
        audit_logs = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(audit_logs)
    return jsonify({"error": "Database connection failed"}), 500

# This route allows admins to log out securely - it identifies the user based on their JWT token, 
# logs the logout action in the User Audit Trail, and can also be used to trigger any necessary cleanup on the frontend (like clearing tokens from local storage)
@app.route('/api/logout', methods=['POST'])
@jwt_required()
def logout():
    # 1. Identify who is logging out based on their JWT wristband
    current_user = get_jwt_identity()
    user_ip = request.remote_addr

    # 2. Record the action in the database
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO app_usage (username, user_ip, action) VALUES (%s, %s, %s)",
                (current_user, user_ip, 'Logout')
            )
            conn.commit()
            cursor.close()
            conn.close()
            print(f"🔒 [SECURITY] User {current_user} logged out successfully.")
            return jsonify({"message": "Successfully logged out"}), 200
        except Exception as e:
            print(f"Logout Error: {e}")
            return jsonify({"error": "Failed to log logout event"}), 500

    return jsonify({"error": "Database connection failed"}), 500

# This route allows the frontend to fetch the most recent system logs to display in the System Logs section of the dashboard -
@app.route('/api/logs', methods=['GET'])
@jwt_required()
def get_system_logs():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Grab the 50 most recent logs from the new table your DBA is building
        cursor.execute("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 50")
        logs = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(logs)
    return jsonify({"error": "Database connection failed"}), 500

# This route allows the frontend to fetch the most recent camera events to display in the Physical Security section of the dashboard -
@app.route('/api/camera-events', methods=['GET'])
@jwt_required()
def get_camera_events():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Grab the 10 most recent physical security events
        cursor.execute("SELECT * FROM camera_events ORDER BY timestamp DESC LIMIT 10")
        events = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(events)
    return jsonify({"error": "Database connection failed"}), 500

# This route allows the frontend to fetch the most recent network traffic data to display in the Traffic Graph on the dashboard - it pulls real data from the database that is being updated by the hardware network monitor thread, so you will see the graph come alive with real traffic patterns based on your server's activity!
@app.route('/api/traffic', methods=['GET'])
@jwt_required()
def get_traffic():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Grab the 30 most recent traffic ticks for the chart
        cursor.execute("SELECT * FROM network_traffic ORDER BY timestamp DESC LIMIT 30")
        data = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(data)
    return jsonify({"error": "Database connection failed"}), 500

# This route allows the frontend to fetch the overall system status data to display in the System Status section of the dashboard - it combines real data from the database (like the number of active threats and recent failed login attempts) with real hardware metrics from psutil (like CPU and RAM load) to provide a comprehensive and realistic snapshot of the system's health and security status.
@app.route('/api/system-status', methods=['GET'])
@jwt_required()
def get_system_status():
    conn = get_db_connection()
    threats_count = 0
    failed_logins = 0
    
    if conn:
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # 1. Get the total number of blocked threats
            cursor.execute("SELECT COUNT(*) as count FROM threats")
            threats_count = cursor.fetchone()['count']
            
            # 2. Get the specific number of failed login attempts!
            cursor.execute("SELECT COUNT(*) as count FROM threats WHERE attack_type = 'Unauthorized Login Attempt'")
            failed_logins = cursor.fetchone()['count']
            
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Status DB Error: {e}")

    # 3. Read the REAL physical hardware of your Render server
    cpu_load = psutil.cpu_percent(interval=None)
    ram_load = psutil.virtual_memory().percent

    # 4. Package realistic, stable data for React
    status_data = {
        "uptime": 99.98,
        "components": [
            # Real Hardware Metrics
            {"name": "Web Server", "status": "online", "load": cpu_load},
            {"name": "Database", "status": "online", "load": ram_load},
            
            # Mocked components to fill out the UI and make it look alive - these are not tied to real hardware but add depth to the dashboard
            {"name": "Firewall", "status": "online", "load": 18.5},
            {"name": "Load Balancer", "status": "online", "load": 22.0},
            {"name": "VPN Gateway", "status": "online", "load": 12.0},
            {"name": "Network Switch", "status": "online", "load": 25.5},
        ],
        "metrics": [ # These are the key performance indicators that show at the top of the dashboard - we will make the Threats Blocked and Failed Logins dynamic based on real data from the database, while the others are static for now to add depth to the UI
            {"label": "Threats Blocked (Total)", "value": str(threats_count), "trend": "Active", "status": "success"},
            {"label": "Active Firewall Rules", "value": "342", "trend": "Stable", "status": "info"},
            {"label": "Failed Login Attempts", "value": str(failed_logins), "trend": "Tracked", "status": "warning" if failed_logins > 0 else "success"},
            {"label": "Malware Detected", "value": "0", "trend": "Clean", "status": "success"},
        ],
        "network": [ # These are the network components that show in the Network Status section of the dashboard - we will make the latency and uptime dynamic based on real data from your server's performance, while the status is static for now to add depth to the UI
            {"name": "Primary Gateway", "status": "Operational", "latency": "12ms", "uptime": "99.99%"},
            {"name": "Secondary Gateway", "status": "Operational", "latency": "18ms", "uptime": "99.97%"},
            {"name": "DNS Servers", "status": "Operational", "latency": "8ms", "uptime": "100%"},
            {"name": "External API", "status": "Operational", "latency": "45ms", "uptime": "99.50%"},
        ]
    }
    return jsonify(status_data)

# This route compiles the various pieces of data needed for the dashboard summary section, which provides a quick snapshot of the system's current status - it pulls real traffic data from the database, counts active threats, fetches recent logs and alerts, and also includes real hardware metrics like CPU load and active connections to give admins a comprehensive overview at a glance.
@app.route('/api/dashboard-summary', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            # 1. Get the single most recent traffic tick
            cursor.execute("SELECT requests_per_sec FROM network_traffic ORDER BY timestamp DESC LIMIT 1")
            traffic_row = cursor.fetchone()
            current_traffic = traffic_row['requests_per_sec'] if traffic_row else 0

            # 2. Get the total number of blocked threats
            cursor.execute("SELECT COUNT(*) as count FROM threats")
            threats_count = cursor.fetchone()['count']

            # 3. Get the 5 most recent system logs
            cursor.execute("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 5")
            recent_logs = cursor.fetchall()

            # 4. Get the 2 most recent alerts
            cursor.execute("SELECT * FROM threats ORDER BY timestamp DESC LIMIT 2")
            recent_alerts = cursor.fetchall()

            cursor.close()
            conn.close()
            # 5. Get the current server load (CPU usage) using psutil
            server_load = psutil.cpu_percent(interval=None)
        
            # 6. Get the current number of active connections (This is a bit tricky without raw socket access, but we can approximate)
            try:
                # Count actual physical network connections
                active_conns = len(psutil.net_connections(kind='inet'))
            except (PermissionError, psutil.AccessDenied):
                # Fallback: strictly tied to traffic volume
                active_conns = int(current_traffic * 2.5) if current_traffic else 12
        
            summary = {
                    "currentTraffic": current_traffic,
                    "activeConnections": active_conns,
                    "blockedThreats": threats_count,
                    "serverLoad": server_load,
                    "recentLogs": recent_logs,
                    "recentAlerts": recent_alerts
                }

            return jsonify(summary)
    
        except Exception as e:
            print(f"Dashboard Summary Error: {e}")
            if conn:
                conn.close()
            return jsonify({"error": "Failed to compile summary"}), 500

    return jsonify({"error": "Database connection failed"}), 500

# This route allows admins to execute a block command against a specific IP address directly from the dashboard - it logs the action in the System Logs with the specific IP and action taken, and also logs it in the User Audit Trail for accountability, including which admin took the action based on their JWT token and IP address. The actual blocking of the IP would be handled by your firewall or network infrastructure, but this route simulates that action and provides the necessary logging for a real mitigation system.
@app.route('/api/block', methods=['POST'])
@jwt_required() 
@limiter.limit("5 per minute") 
def execute_block_command():
    current_user = get_jwt_identity()
    incoming_data = request.get_json()
    target_ip = incoming_data.get('ip_address')

    if not target_ip:
        return jsonify({"error": "No IP address provided"}), 400

    print(f"🚨 [DEFENSE SYSTEM ACTIVATED] User {current_user} blocking IP: {target_ip}")
    return jsonify({"status": "success", "target": target_ip}), 200

# This is the main route that serves the dashboard page - it also logs every visit to the dashboard in the app_usage table with the visitor's IP address, which can be useful for monitoring access patterns and identifying potential unauthorized access attempts. In a real application, you might want to restrict this route to authenticated users only, but for demonstration purposes, we will allow anyone to access it and log their visits.
@app.route('/')
def home():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            # Log the visitor's IP 
            cursor.execute(
                "INSERT INTO app_usage (username, user_ip) VALUES (%s, %s)", 
                ("Web Visitor", get_remote_address())
            )
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Dashboard Data Error: {e}")

    return render_template('dashboard.html')

if __name__ == '__main__':
    test = get_db_connection()
    if test:
        print("✅ SUCCESS: Linked to PostgreSQL.")
        test.close()
    else:
        print("❌ FAILED: Could not link to PostgreSQL. Check .env file.")

    app.run(debug=True, use_reloader=False)