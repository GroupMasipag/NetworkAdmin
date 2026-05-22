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
            # NEW: The Users table for your secure login
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
        # STEP 4: INSERT YOUR CUSTOM CREDENTIALS HERE
        # ==========================================
        YOUR_USERNAME = 'lvbgabriel'
        YOUR_PASSWORD = 'rukia@123'

        # Check if this user already exists so we don't accidentally duplicate it
        cursor.execute("SELECT * FROM users WHERE username = %s", (YOUR_USERNAME,))
        if not cursor.fetchone():
            # Scramble the password securely
            hashed_pw = generate_password_hash(YOUR_PASSWORD)
            
            # Save the scrambled password to the database
            cursor.execute(
                "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
                (YOUR_USERNAME, hashed_pw)
            )
            print(f"👤 Admin account '{YOUR_USERNAME}' automatically created!")
        else:
            print(f"ℹ️ Account '{YOUR_USERNAME}' already exists in the database. Skipping creation.")
        # ==========================================


        # 5. Save changes and close
        connection.commit()
        print("✅ Database initialized successfully! All tables are ready.")

        cursor.close()
        connection.close()

    except Exception as error:
        print(f"❌ Error while initializing database: {error}")

if __name__ == "__main__":
    init_database()



