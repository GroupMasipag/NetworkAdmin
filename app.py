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
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Allows frontend to talk to backend

limiter = Limiter(get_remote_address, app=app, storage_uri="memory://")

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

    # SUBJECT TO CHANGE LATER IN LINKING OF DB
    simulated_hash = generate_password_hash("admin123")

    if username == "admin" and check_password_hash(simulated_hash, password):
        access_token = create_access_token(identity=username)
        return jsonify({"token": access_token, "message": "Login successful"}), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/threats', methods=['GET'])
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