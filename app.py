import os
import threading
import time
import random
import getpass
import psycopg2
import psycopg2.extras
from flask import Flask, render_template
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# 1. SETUP & DATABASE LINK
load_dotenv() 
app = Flask(__name__)
limiter = Limiter(get_remote_address, app=app, storage_uri="memory://")

def get_db_connection():
    try:
        # Connects using the string in your .env file
        return psycopg2.connect(os.getenv("DATABASE_URL"))
    except Exception as e:
        print(f"❌ DATABASE ERROR: {e}")
        return None

# 2. THE DETECTION MECHANIC (SCANNER)
def network_scanner():
    """Background process to simulate threat detection."""
    print(">>> [SYSTEM] Scanner Initialized: Monitoring Network...")
    
    attack_types = ['DDoS Attempt', 'SQL Injection', 'Unauthorized Login', 'Port Scan']

    while True:
        time.sleep(15)  # Scans every 15 seconds
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                # Generate a random IP to simulate an external visitor
                detected_ip = f"192.168.1.{random.randint(10, 254)}"
                
                attack = random.choice(attack_types)
                severity = random.choice(['Low', 'Medium', 'High'])
                
                # Directly log every 'detected' IP into the database
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

# 4. DASHBOARD ROUTE
@app.route('/')
def home():
    conn = get_db_connection()
    usage_logs = []
    threat_logs = []
    
    if conn:
        try:
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Log who is viewing the dashboard
            cursor.execute(
                "INSERT INTO app_usage (username, user_ip) VALUES (%s, %s)", 
                (getpass.getuser(), get_remote_address())
            )
            conn.commit()
            
            # Fetch data for the tables
            cursor.execute("SELECT * FROM app_usage ORDER BY access_time DESC LIMIT 5")
            usage_logs = cursor.fetchall()
            
            cursor.execute("SELECT * FROM threats ORDER BY timestamp DESC LIMIT 5")
            threat_logs = cursor.fetchall()
            
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Dashboard Data Error: {e}")

    return render_template('dashboard.html', usage=usage_logs, threats=threat_logs)

# 5. RUN THE APP
if __name__ == '__main__':
    test = get_db_connection()
    if test:
        print("✅ SUCCESS: Linked to PostgreSQL.")
        test.close()
        
        print(">>> Attempting to start Scanner...")
        daemon_thread = threading.Thread(target=network_scanner, daemon=True)
        daemon_thread.start()
        print(">>> Scanner Thread is now running in background.")
    else:
        print("❌ FAILED: Could not link to PostgreSQL. Check .env file.")

    # use_reloader=False is REQUIRED so the scanner doesn't restart/die
    app.run(debug=True, use_reloader=False)