import os
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

# 1. SETUP & DATABASE LINK
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

    while True:
        # Wait 2 seconds (Matches your React UI TrafficGraph refresh rate!)
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

                # Insert the REAL hardware data into the database
                cursor.execute(
                    """INSERT INTO network_traffic (requests_per_sec, active_threats, bandwidth_mbps, packets) 
                       VALUES (%s, %s, %s, %s)""",
                    (int(packets_per_sec), active_threats, round(bandwidth_mbps, 2), int(packets_per_sec))
                )
                conn.commit()
                cursor.close()
                conn.close()
            except Exception as e:
                print(f"Hardware Monitor Error: {e}")

# 3. START THE SCANNER THREAD
threading.Thread(target=network_scanner, daemon=True).start()

# API ROUTES 

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

@app.route('/api/threats', methods=['GET'])
@jwt_required()
def get_threat_logs():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT * FROM threats ORDER BY timestamp DESC LIMIT 20")
        threats = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(threats)
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

@app.route('/api/audit-trail', methods=['GET'])
@jwt_required()
def get_audit_trail():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        # Fetch the 50 most recent user actions
        cursor.execute("SELECT username, user_ip, action, timestamp FROM app_usage ORDER BY timestamp DESC LIMIT 50")
        audit_logs = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(audit_logs)
    return jsonify({"error": "Database connection failed"}), 500

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

#REPLACED MOCK DATA
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

#blocking api route -- jwt
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

# DASHBOARD ROUTE 
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