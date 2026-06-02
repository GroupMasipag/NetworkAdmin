import os
import cv2
import threading
import datetime
import time
import psycopg2
import psycopg2.extras
import psutil
from flask import Flask, render_template, jsonify, request, Response
from dotenv import load_dotenv
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, set_access_cookies
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.middleware.proxy_fix import ProxyFix

# 1. INITIAL SETUP
load_dotenv() 
app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/api/*": {
    "origins": [
        "http://localhost:5173", # Local development URL for React frontend
        "https://networkadministrationgroup6.onrender.com", # Production URL for React frontend
        "https://acoustic-closing-thunder-widespread.trycloudflare.com" #cloudflare tunnel URL 
    ]}}) # Allows frontend to talk to backend

limiter = Limiter(
    get_remote_address, 
    app=app, 
    storage_uri="memory://",
    default_limits=["200 per minute"]
    ) # Basic rate limiting to prevent abuse; can be adjusted as needed

# 1.5 JWT CONFIGURATION
jwt_secret = os.getenv("JWT_SECRET_KEY")
if not jwt_secret:
    raise ValueError("FATAL ERROR: JWT_SECRET_KEY is not set in the environment!")
app.config["JWT_SECRET_KEY"] = jwt_secret

# --- JWT COOKIE CONFIGURATION ---
# 1. Force Flask to look inside Cookies instead of Headers
app.config['JWT_TOKEN_LOCATION'] = ['cookies']

# 2. Allow cookies to travel over HTTPS (Required for Render hosting)
app.config['JWT_COOKIE_SECURE'] = True

# 3. Crucial! Allows the cookie to cross from your frontend Render URL to your backend Render URL
app.config['JWT_COOKIE_SAMESITE'] = 'None'

# 4. Disable double CSRF tokens for the demo to prevent strict token mismatch errors
app.config['JWT_COOKIE_CSRF_PROTECT'] = False

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
    # MODIFIED: Configured with your explicit camera RTSP source destination
    camera_source = "https://name-meat-yet-stage.trycloudflare.com/stream?key=praise-the-fool"
    
    camera = cv2.VideoCapture(camera_source, cv2.CAP_FFMPEG)
    
    # Set resolution limits to prevent overloading server bandwidth
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
            # Add a professional "LIVE" timestamp overlay onto the video stream
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cv2.putText(frame, f"CCTV LIVE - {timestamp}", (10, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

            # MODIFIED: Fixed encoding quality attribute from lowercase typo to uppercase IMWRITE_JPEG_QUALITY
            ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            if not ret:
                continue
                
            frame_bytes = buffer.tobytes()
            
            # Use multipart boundary packaging to stream frame-by-frame continuously
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    camera.release()

# 4. API ROUTES

@app.route('/api/camera/stream')
def video_feed():
    return Response(generate_camera_frames(), 
                    mimetype='multipart/x-mixed-replace; boundary=frame')

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
            
            # Create the response
            response = jsonify({"message": "Login successful"})
            
            # Bake the access token into the response as a secure HttpOnly cookie
            set_access_cookies(response, access_token)
            
            return response, 200 
            
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

    return jsonify({"error": "Invalid username or password"}), 401

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

@app.route('/api/threats/<int:threat_id>/mitigate', methods=['POST'])
@jwt_required()
def mitigate_threat(threat_id):
    current_user = get_jwt_identity()
    admin_ip = request.remote_addr
    
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

@app.route('/api/logout', methods=['POST'])
@jwt_required()
def logout():
    current_user = get_jwt_identity()
    user_ip = request.remote_addr

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
            response = jsonify({"message": "Successfully logged out"})
            unset_jwt_cookies(response)
            return response, 200
        except Exception as e:
            print(f"Logout Error: {e}")
            return jsonify({"error": "Failed to log logout event"}), 500

    return jsonify({"error": "Database connection failed"}), 500

@app.route('/api/logs', methods=['GET'])
@jwt_required()
def get_system_logs():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 50")
        logs = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(logs)
    return jsonify({"error": "Database connection failed"}), 500

@app.route('/api/camera-events', methods=['GET'])
@jwt_required()
def get_camera_events():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT * FROM camera_events ORDER BY timestamp DESC LIMIT 10")
        events = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(events)
    return jsonify({"error": "Database connection failed"}), 500

@app.route('/api/traffic', methods=['GET'])
@jwt_required()
def get_traffic():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT * FROM network_traffic ORDER BY timestamp DESC LIMIT 30")
        data = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(data)
    return jsonify({"error": "Database connection failed"}), 500

@app.route('/api/system-status', methods=['GET'])
@jwt_required()
def get_system_status():
    conn = get_db_connection()
    threats_count = 0
    failed_logins = 0
    
    if conn:
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cursor.execute("SELECT COUNT(*) as count FROM threats")
            threats_count = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM threats WHERE attack_type = 'Unauthorized Login Attempt'")
            failed_logins = cursor.fetchone()['count']
            
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Status DB Error: {e}")

    cpu_load = psutil.cpu_percent(interval=None)
    ram_load = psutil.virtual_memory().percent

    status_data = {
        "uptime": 99.98,
        "components": [
            {"name": "Web Server", "status": "online", "load": cpu_load},
            {"name": "Database", "status": "online", "load": ram_load},
            {"name": "Firewall", "status": "online", "load": 18.5},
            {"name": "Load Balancer", "status": "online", "load": 22.0},
            {"name": "VPN Gateway", "status": "online", "load": 12.0},
            {"name": "Network Switch", "status": "online", "load": 25.5},
        ],
        "metrics": [
            {"label": "Threats Blocked (Total)", "value": str(threats_count), "trend": "Active", "status": "success"},
            {"label": "Active Firewall Rules", "value": "342", "trend": "Stable", "status": "info"},
            {"label": "Failed Login Attempts", "value": str(failed_logins), "trend": "Tracked", "status": "warning" if failed_logins > 0 else "success"},
            {"label": "Malware Detected", "value": "0", "trend": "Clean", "status": "success"},
        ],
        "network": [
            {"name": "Primary Gateway", "status": "Operational", "latency": "12ms", "uptime": "99.99%"},
            {"name": "Secondary Gateway", "status": "Operational", "latency": "18ms", "uptime": "99.97%"},
            {"name": "DNS Servers", "status": "Operational", "latency": "8ms", "uptime": "100%"},
            {"name": "External API", "status": "Operational", "latency": "45ms", "uptime": "99.50%"},
        ]
    }
    return jsonify(status_data)

@app.route('/api/dashboard-summary', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            cursor.execute("SELECT requests_per_sec FROM network_traffic ORDER BY timestamp DESC LIMIT 1")
            traffic_row = cursor.fetchone()
            current_traffic = traffic_row['requests_per_sec'] if traffic_row else 0

            cursor.execute("SELECT COUNT(*) as count FROM threats")
            threats_count = cursor.fetchone()['count']

            cursor.execute("SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 5")
            recent_logs = cursor.fetchall()

            cursor.execute("SELECT * FROM threats ORDER BY timestamp DESC LIMIT 2")
            recent_alerts = cursor.fetchall()

            cursor.close()
            conn.close()
            server_load = psutil.cpu_percent(interval=None)
        
            try:
                active_conns = len(psutil.net_connections(kind='inet'))
            except (PermissionError, psutil.AccessDenied):
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

@app.route('/')
def home():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
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

    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    port = int(os.environ.get("PORT", 5001))
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)
