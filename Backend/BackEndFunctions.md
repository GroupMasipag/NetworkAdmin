The API Route (/api/threats) frontend now has a dedicated URL it can visit to grab a list of network threats in a format (JSON) that JavaScript can easily read and turn into charts or tables.

The Command Endpoint (/api/block) is listening. capable of receiving a request, extracting an IP address, validating it, and executing a response.

POSTGRES 

GUIDE -- 
We are using POSTGRESQL for this project so we do not have to configure heavy external database servers. DATABASE IS NOW LIVE IN RENDER please use our external url for access :)

Flask-CORS - Lock Down API Access

Base URL (Local): http://127.0.0.1:5000

Base URL (Live): https://network-defense-api.onrender.com

Get Threats: GET /api/threats (Returns an array of JSON objects).

Login: POST /api/login (Send JSON: {"username": "admin", "password": "admin123"}). This will return a token.

Block IP: POST /api/block (Requires the JWT token in the Authorization header. Send JSON: {"ip_address": "192.168.1.X"}).