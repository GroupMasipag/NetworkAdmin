from flask import Flask, jsonify, request, render_template
import subprocess # used for linux commands
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

import psycopg2
import psycopg2.extras
import os 
from dotenv import load_dotenv

load_dotenv( )

app = Flask(__name__)

# Lock it down: Only allow your frontend (e.g., localhost:3000) to talk to this backend
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}}) #subject to change

# Initialize the rate limiter to prevent spam attacks
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["100 per day", "30 per hour"],
    storage_uri="memory://"
)

def get_db_connection( ):
    "connects to postgres using URL in .environment"
    db_url = os.getenv("DATABASE_URL")

    conn = psycopg2.connect(db_url)

    return conn

# ==========================================
# DASHBOARD INTERFACE (FOR THE DEMO!)
# ==========================================
@app.route('/', methods=['GET'])
def home():
    """
    Serves the main dashboard HTML page with the live camera feed.
    """
    return render_template('dashboard.html')

#API ROUTING
@app.route('/api/threats', methods=['GET'])
def get_threat_logs():
    try:
        conn = get_db_connection( )
        #use realdictcursor output = JSON
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        #STANDARD SQL QUERIES HERE
        cursor.execute("SELECT * FROM threats ORDER BY id DESC")
        threats = cursor.fetchall()

        cursor.close()
        conn.close()
        #conn stands fpr connection for reference

        return jsonify(threats)

    except Exception as e:
        print(f"Database Error: {e}")
        return jsonify({"error": "Failed to fetch the threats"})


#BLOCK COMMAND ENDPOINT ( INCOMING )
@app.route('/api/block', methods=['POST'])
@limiter.limit("5 per minute") # Added limiter: Max 5 blocks per minute per user
def execute_block_command():
    """
    frontend will send a POST request here with an IP address to block.
    """
    # 1. Grab the JSON data sent by the frontend
    incoming_data = request.get_json()
    
    # 2. Extract the specific IP address
    target_ip = incoming_data.get('ip_address')

    # 3. Safety check: Did they actually send an IP?
    if not target_ip:
        return jsonify({"error": "No IP address provided in the request"}), 400

    # 4. LINUX
    # WSL = CAN USE PYTHON SUBPROCESS
    # trigger a real firewall rule here using iptables: ( DONT TOUCH UNTIL FRONT END IS DONE )
    # subprocess.run(["sudo", "iptables", "-A", "INPUT", "-s", target_ip, "-j", "DROP"])
    
    print(f"[-DEFENSE SYSTEM ACTIVATED-] Executing block on IP: {target_ip}") #dipa final

    # 5. Send a success message back to the frontend
    return jsonify({
        "status": "success",
        "action_taken": "DROP",
        "target": target_ip,
        "message": f"Successfully deployed block rules for {target_ip}"
    }), 200
    #http://127.0.0.1:5000/api/threats -- location ng mga intercepted threats

if __name__ == '__main__':
    app.run(debug=True)