#SETUP GUIDE -- LINUX INTEGRATION#

Welcome to the NetworkAdmin project! Because this system deals with network defenses and server architecture, we are strictly developing this using Linux via WSL (Windows Subsystem for Linux). 

Please do not run the Flask server in standard Windows, as file paths and native networking tools will behave differently than our production environment. Follow the steps below to get your local environment running securely.

--------------------------------------------------
Phase 1: System Prerequisites (Do this once)
--------------------------------------------------

1. Install WSL (Ubuntu)
   Open standard Windows PowerShell as an Administrator and run:
   wsl --install -d Ubuntu
   
   Note: You may need to restart your PC and ensure Hardware Virtualization is enabled in your BIOS. Once restarted, create your UNIX username and password when prompted.

2. Install the VS Code Extension
   Open VS Code, go to the Extensions tab (Ctrl+Shift+X), and install the WSL extension (published by Microsoft).

--------------------------------------------------
Phase 2: Getting the Project
--------------------------------------------------

1. Clone the Repository
   Open a terminal in your standard Windows environment (e.g., in your Documents folder) and clone the code:
   git clone https://github.com/GroupMasipag/NetworkAdmin.git

2. Open the Project in Linux
   Open the new NetworkAdmin folder in VS Code. 
   - Press F1 to open the Command Palette.
   - Type "WSL: Reopen Folder in WSL" and hit Enter.
   - Verify: Look at the bottom-left corner of VS Code. It must say "WSL: Ubuntu" in a blue or green box.

--------------------------------------------------
Phase 3: Building the Secure Environment (Do this once)
--------------------------------------------------

We use an isolated virtual environment to prevent package conflicts. Never push the 'venv' folder to GitHub.

1. Open a Linux Terminal
   In VS Code, go to Terminal > New Terminal. The prompt should be a bash shell.

2. Install Python Tools
   Update Ubuntu and install the virtual environment maker:
   sudo apt update
   sudo apt install python3-venv python3-pip -y

3. Create the Environment
   python3 -m venv venv

--------------------------------------------------
Phase 4: Running the Server (Do this every time you code)
--------------------------------------------------

Whenever you sit down to work on the backend or preview the frontend dashboard, you must run the server.

1. Activate the Environment
   source venv/bin/activate
   (You should see '(venv)' appear at the start of your terminal line).

2. Install Dependencies
   Read the requirements file to install Flask and our tools:
   pip install -r requirements.txt

3. Start the Dashboard
   python3 app.py
   
   Ctrl+Click the http://127.0.0.1:5000 link in the terminal to view the dashboard in your browser.

--------------------------------------------------
Bonus Tip: Fix High RAM Usage (vmmem)
--------------------------------------------------

WSL is extremely fast but will consume a lot of RAM. To stop WSL from slowing down your computer, restrict its memory usage:

1. Open standard Windows File Explorer.
2. Go to C:\Users\YourUsername\
3. Create a file named exactly .wslconfig (Make sure Windows doesn't save it as a .txt file!).
4. Add this code to the file and save:
   [wsl2]
   memory=4GB
   processors=2
5. Open Windows PowerShell and run "wsl --shutdown" to apply the limits.

------------------------------------------------------
DO THIS IF YOU WANT TO EXIT 
------------------------------------------------------
open powershell of windows
wsl --shutdown in powershell to close wsl server