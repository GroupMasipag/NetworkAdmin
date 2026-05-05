The API Route (/api/threats) frontend now has a dedicated URL it can visit to grab a list of network threats in a format (JSON) that JavaScript can easily read and turn into charts or tables.

The Command Endpoint (/api/block) is listening. capable of receiving a request, extracting an IP address, validating it, and executing a response.

init_db.py file - dito database - POSTGRES 

GUIDE -- 
We are using POSTGRESQL for this project so we do not have to configure heavy external database servers. The database will live locally in a file called `network_defense.db`.

Flask-CORS - Lock Down API Access

**1. Initialize the Database**
Before you can write any POSTGRESQL in the app, you need to create the `.db` file. 
* Open your WSL Terminal and ensure your virtual environment is active (`source venv/bin/activate`).
* Create a file named `init_db.py` in the root folder.
* Write a Python script to connect to `network_defense.db` and execute a `CREATE TABLE` query for our network threats. 
* Run the script once: `python3 init_db.py`

**2. Connect the Database to the API**
Inside `app.py`, you will need to import `POSTGRESQL` and create a connection helper function.

**3. Update the Routes**
Swap out the simulated data in our API routes with real POSTGRESQL queries:
* Update `/api/threats` to run a `SELECT` query and return the rows as JSON.
* Update `/api/block` to run an `INSERT` query so new blocks are logged in the database before the firewall rule triggers.