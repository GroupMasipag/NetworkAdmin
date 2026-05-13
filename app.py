from flask import Flask, jsonify, request, render_template
import subprocess # used for linux commands
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

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
    """
    Your frontend will hit this URL to populate its tables.
    For now, we use simulated data, but later this can read from a database.
    """
    simulated_threats = [
        {"id": 1, "ip": "192.168.1.105", "attack_type": "DDoS Attempt", "severity": "High"},
        {"id": 2, "ip": "10.0.0.42", "attack_type": "Failed SSH Login", "severity": "Medium"}
    ]
    # jsonify converts the Python dictionary into standard JSON format
    return jsonify(simulated_threats)


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