from flask import Flask, render_template

app = Flask(__name__)

# Mock data // TEST CASE 
intercepted_threats = [
    {"id": 1, "type": "ARP Spoofing", "source_ip": "192.168.1.105", "status": "Blocked", "time": "10:42 AM"},
    {"id": 2, "type": "DDoS (SYN Flood)", "source_ip": "Multiple", "status": "Mitigated", "time": "09:15 AM"},
    {"id": 3, "type": "Man-in-the-Middle Try", "source_ip": "10.0.0.50", "status": "Flagged", "time": "08:30 AM"}
]

@app.route('/')
def dashboard():
    # render_template looks inside the 'templates' folder 
    # We pass the 'intercepted_threats' list to the HTML file as a variable named 'threats'
    return render_template('index.html', threats=intercepted_threats)

if __name__ == '__main__':
    # allows the server to auto-reload 
    app.run(debug=True)