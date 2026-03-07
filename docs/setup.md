
Method 1: Traditional Setup (WINDOWS)

    1) Download Postgres V18.1 from: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

    2) Within the wizard (follow the instructions and trust defaults, but take note of these bullets): 
        -Select Components: You just need PostgreSQL Server (also command line tools are recommended).
        -When selecting applications to install, only select Categories > Database Server > "Postgre...(installed)".
        
    3) Create a .env file within backend directory. Fill it out according to the .env.example template.

    4) Within root directory:
        -Run 'npm run install:all'
        -Run 'npm run dev'


Method 2: Docker Setup (WINDOWS)

    1) Download Docker Desktop from: https://docs.docker.com/desktop/setup/install/windows-install/ 

    2) Ensure Docker is running (No steps provided, check out: https://www.docker.com/blog/getting-started-with-docker-desktop/)

    3) Within root directory:
        -Run 'docker compose up --build'  (if code has been changed
        -Run 'docker compose up' (if code has NOT been changed)
        -Run 'docker compose down -v' (if you want to reset the database) 


Using DBeaver:

To connect to a new database:

    1) Connect to a database > PostgreSQL > press next

    2) Enter default credentials for your local db server, they are usually:
    
        -host: localhost
        -database: postgres
        -port: 5432 (If you are using Docker, enter 5433)
        -username: postgres
        -password: <whatever password you entered when installing postgres>

    3) Check 'Show all databases' > press Finish
