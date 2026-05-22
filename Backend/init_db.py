import psycopg2
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

# Load credentials from your .env file
load_dotenv()

def init_database():
    try:
        # 1. Connect to the database
        connection = psycopg2.connect(os.getenv("DATABASE_URL"))
        cursor = connection.cursor()

        # 2. Master list of all your database tables
        create_tables_queries = [
            """
            CREATE TABLE IF NOT EXISTS app_usage (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100),
                user_ip VARCHAR(50),
                access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS threats (
                id SERIAL PRIMARY KEY,
                ip VARCHAR(50) NOT NULL,
                attack_type VARCHAR(100) NOT NULL,
                severity VARCHAR(20) NOT NULL,
                description TEXT,
                status VARCHAR(20) DEFAULT 'active',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS system_logs (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                level VARCHAR(20),
                category VARCHAR(50),
                message TEXT,
                source VARCHAR(100),
                details TEXT
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS network_traffic (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                requests_per_sec INTEGER,
                active_threats INTEGER,
                bandwidth_mbps DECIMAL(5,2),
                packets INTEGER
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS camera_events (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                camera_id VARCHAR(50),
                event_description TEXT,
                severity VARCHAR(20)
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        ]

        # 3. Execute all table creations
        for query in create_tables_queries:
            cursor.execute(query)

        # ==========================================
        # STEP 4: SEED DEMO DATA INTO TABLES
        # ==========================================
        
        # Seed Initial Threats (if empty)
        cursor.execute("SELECT COUNT(*) FROM threats")
        if cursor.fetchone()[0] == 0:
            print("🌱 Seeding initial threats...")
            threats_data = [
                ('203.0.113.10', 'DDoS Attempt', 'High', 'Volumetric SYN flood detected'),
                ('198.51.100.45', 'SQL Injection', 'Critical', 'Multiple failed auth attempts with SQL syntax'),
                ('192.0.2.88', 'Port Scan', 'Medium', 'Sequential scanning of ports 20-1024')
            ]
            for t in threats_data:
                cursor.execute(
                    "INSERT INTO threats (ip, attack_type, severity, description) VALUES (%s, %s, %s, %s)",
                    t
                )

        # Seed Initial System Logs (if empty)
        cursor.execute("SELECT COUNT(*) FROM system_logs")
        if cursor.fetchone()[0] == 0:
            print("🌱 Seeding initial system logs...")
            logs_data = [
                ('CRITICAL', 'Network', 'DDoS traffic spike detected — 4,230 req/s (threshold: 800)', 'Firewall'),
                ('WARN', 'Network', 'Rate threshold exceeded on eth0 — mitigation activated', 'Traffic Control'),
                ('INFO', 'Security', 'Firewall lookup: 203.0.113.10 → MATCH (known botnet C2)', 'Threat Intel'),
                ('INFO', 'Security', 'Firewall lookup: 198.51.100.45 → MATCH (known botnet C2)', 'Threat Intel'),
                ('INFO', 'Security', 'Firewall lookup: 192.0.2.88 → MATCH (TOR exit node)', 'Threat Intel'),
                ('WARN', 'Network', 'SYN flood — 12,400 half-open connections on :443', 'Firewall'),
                ('INFO', 'Network', 'SYN cookies enabled on eth0', 'Kernel'),
                ('INFO', 'Routing', 'Null-route request sent to upstream AS64512', 'BGP Daemon'),
                ('INFO', 'Routing', 'Traffic scrubbing center active — BGP updated', 'BGP Daemon'),
                ('INFO', 'System', 'Mitigation protocol ALPHA-7 fully engaged', 'Security Agent')
            ]
            for l in logs_data:
                cursor.execute(
                    "INSERT INTO system_logs (level, category, message, source) VALUES (%s, %s, %s, %s)",
                    l
                )

        # ==========================================
        # STEP 5: CREATE ADMIN USER
        # ==========================================
        YOUR_USERNAME = 'zernjr123'
        YOUR_PASSWORD = '9851#2409dkjv'

        cursor.execute("SELECT * FROM users WHERE username = %s", (YOUR_USERNAME,))
        if not cursor.fetchone():
            hashed_pw = generate_password_hash(YOUR_PASSWORD)
            cursor.execute(
                "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
                (YOUR_USERNAME, hashed_pw)
            )
            print(f"👤 Admin account '{YOUR_USERNAME}' automatically created!")
        else:
            print(f"ℹ️ Account '{YOUR_USERNAME}' already exists in the database. Skipping creation.")

        # Save changes and close
        connection.commit()
        print("✅ Database initialized and seeded successfully!")

        cursor.close()
        connection.close()

    except Exception as error:
        print(f"❌ Error while initializing database: {error}")

if __name__ == "__main__":
    init_database()