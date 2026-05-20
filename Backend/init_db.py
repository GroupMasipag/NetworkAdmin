import psycopg2
import os
from dotenv import load_dotenv

# Load credentials from your .env file
load_dotenv()

def init_database():
    try:
        # 1. Connect to the database defined in your .env
        connection = psycopg2.connect(os.getenv("DATABASE_URL"))
        cursor = connection.cursor()

        # 2. SQL commands to create your tables
        # Using "IF NOT EXISTS" prevents errors if you run this twice
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
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        ]

        # 3. Execute the queries
        for query in create_tables_queries:
            cursor.execute(query)

        # 4. Save changes and close
        connection.commit()
        print("✅ Database initialized successfully! Tables are ready.")

        cursor.close()
        connection.close()

    except Exception as error:
        print(f"❌ Error while initializing database: {error}")

if __name__ == "__main__":
    init_database()