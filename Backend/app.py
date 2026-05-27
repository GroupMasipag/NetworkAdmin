import os
import threading
import time
import random
import psycopg2
import psycopg2.extras
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
    """Background process to simulate threat detection."""
    print(">>> [SYSTEM] Scanner Initialized: Monitoring Network...")
    attack_types = ['DDoS Attempt', 'SQL Injection', 'Unauthorized Login', 'Port Scan']

    while True:
        time.sleep(15)  
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                detected_ip = f"192.168.1.{random.randint(10, 254)}"
                attack = random.choice(attack_types)
                severity = random.choice(['Low', 'Medium', 'High'])
                
                cursor.execute(
                    "INSERT INTO threats (ip, attack_type, severity) VALUES (%s, %s, %s)",
                    (detected_ip, attack, severity)
                )
                conn.commit()
                print(f"⚠️ [DETECTION] Threat logged: {attack} from {detected_ip}")
                cursor.close()
                conn.close()
            except Exception as e:
                print(f"Scanner Loop Error: {e}")

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
                "INSERT INTO app_usage (username, user_ip) VALUES (%s, %s)",
                (username, request.remote_addr)
            )
            conn.commit()
            
            cursor.close()
            conn.close()
            return jsonify({"token": access_token, "message": "Login successful"}), 200
            
        cursor.close()
        conn.close()

    # Generic error for both wrong username OR wrong password
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

#JUST MOCK DATA TO SHOW REACT WORKS -- 
@app.route('/api/system-status', methods=['GET'])
@jwt_required()
def get_system_status():
    conn = get_db_connection()
    threats_count = 0
    if conn:
        cursor = conn.cursor()
        # Count the ACTUAL number of threats in the database!
        cursor.execute("SELECT COUNT(*) FROM threats")
        threats_count = cursor.fetchone()[0]
        cursor.close()
        conn.close()

    # Generate live, breathing server statistics
    status_data = {
        "uptime": round(random.uniform(99.95, 99.99), 2),
        "components": [
            {"name": "Web Server", "status": "online", "load": random.randint(40, 85)},
            {"name": "Database", "status": "online", "load": random.randint(30, 70)},
            {"name": "Firewall", "status": "online", "load": random.randint(20, 60)},
            {"name": "Load Balancer", "status": "online", "load": random.randint(40, 80)},
            {"name": "VPN Gateway", "status": "warning" if random.random() > 0.8 else "online", "load": random.randint(60, 95)},
            {"name": "Network Switch", "status": "online", "load": random.randint(20, 50)},
        ],
        "metrics": [
            {"label": "Threats Blocked (24h)", "value": str(threats_count), "trend": "+12%", "status": "success"},
            {"label": "Active Firewall Rules", "value": "342", "trend": "+5", "status": "info"},
            {"label": "Failed Login Attempts", "value": str(random.randint(0, 15)), "trend": "-8%", "status": "warning"},
            {"label": "Malware Detected", "value": "0", "trend": "-15%", "status": "success"},
        ],
        "network": [
            {"name": "Primary Gateway", "status": "Operational", "latency": f"{random.randint(8, 15)}ms", "uptime": "99.99%"},
            {"name": "Secondary Gateway", "status": "Operational", "latency": f"{random.randint(12, 25)}ms", "uptime": "99.97%"},
            {"name": "DNS Servers", "status": "Operational", "latency": f"{random.randint(5, 12)}ms", "uptime": "100%"},
            {"name": "External API", "status": "Degraded" if random.random() > 0.9 else "Operational", "latency": f"{random.randint(40, 150)}ms", "uptime": "98.50%"},
        ]
    }
    return jsonify(status_data)

@app.route('/api/dashboard-summary', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    conn = get_db_connection()
    if conn:
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

        # Package it all together
        summary = {
            "currentTraffic": current_traffic,
            "activeConnections": int(current_traffic * 2.5) if current_traffic else random.randint(500, 1500),
            "blockedThreats": threats_count,
            "serverLoad": random.randint(40, 75), # Random for now, but could use psutil!
            "recentLogs": recent_logs,
            "recentAlerts": recent_alerts
        }

        return jsonify(summary)
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