# How to Install and Run the Queue Management System

This guide provides step-by-step instructions for setting up a local development environment for the Queue Management System using VSCode and Docker.

## Prerequisites

Before you begin, ensure you have the following software installed and configured:

1.  **Visual Studio Code**: The primary editor for this project.
2.  **WSL2 (Windows Subsystem for Linux)**: Required for running the Docker environment on Windows. We recommend a distribution like Ubuntu LTS.
3.  **Docker**: `docker-compose` must be installed and the Docker daemon (`dockerd`) must be running within your WSL2 distribution. Docker Desktop for Windows is a common way to manage this.
4.  **Git**: For cloning the source code repository.

---

## Step 1: Clone the Repository

First, clone the project source code to your local machine.

```bash
git clone https://github.com/bcgov/queue-management.git
cd queue-management
```

---

## Step 2: Set Up Configuration Files

The application requires several configuration files and environment variables that are not stored in the git repository for security reasons.

**1. Obtain `.env` files:**

   - The `.env` files for various services (API, frontend, etc.) must be obtained from the **"DevOps - Openshift" Teams Channel**.

**2. Place Configuration Files:**

   - Place the obtained `.env` files and other required configuration files according to the directory structure below. You may need to create some of these directories.

   ```
   queue-management
   ├───api
   │       .env
   │
   ├───appointment-frontend
   │   └───public
   │       └───config
   │           └───kc
   │                   keycloak-public.json
   │
   ├───feedback-api
   │       .env
   │
   ├───frontend
   │   ├───public
   │   │   ├───config
   │   │   │       configuration.json
   │   │   │
   │   │   └───static
   │   │       └───keycloak
   │   │               keycloak.json
   │   │
   │   └───.env
   │
   ├───jobs
   │   └───appointment_reminder
   │           .env
   │
   └───notifications-api
           .env
   ```

**3. KeyCloak Configuration:**

- **`frontend/public/static/keycloak/keycloak.json`**: This file is required for the frontend container to connect to KeyCloak. It should have the following structure:
  ```json
  {
    "realm": "",
    "auth-server-url": "",
    "ssl-required": "",
    "resource": "",
    "credentials": {
      "secret": ""
    }
  }
  ```
- **`api/client_secrets/secrets.json`** (Create this directory if it doesn't exist): This file is required for the API container.
  ```json
  {
    "web": {
      "realm_public_key": "",
      "issuer": "" ,
      "auth_uri": "" ,
      "client_id": "",
      "client_secret": "",
      "redirect_urls": [ "" ],
      "userinfo_uri": "" ,
      "token_uri": "" ,
      "token_introspection_uri": ""
    }
  }
  ```
---

## Step 3: Launch the Development Environment

This project is configured to run inside Docker containers. You have two main options to launch your development environment:

### Option 1: Using VSCode Remote - Containers (Recommended)

This is the recommended approach as it sets up the entire development environment, including infrastructure services and the Python/Node environment for the applications, seamlessly.

1.  Open the cloned `queue-management` folder in VSCode.
2.  VSCode should detect the `.devcontainer` configuration and show a notification in the bottom-right corner.
3.  Click the button that says **"Reopen in Container"**.
4.  VSCode will now build the necessary Docker containers (PostgreSQL database, and a Python/Node container for the applications). This may take some time on the first run.

### Option 2: Manually Starting Infrastructure with Docker Compose

If you prefer to start the infrastructure services (Postgres, Redis, Keycloak, MinIO) outside of the VSCode Remote - Containers environment, you can use `docker-compose`. Note that this `docker-compose.yml` **only** brings up the infrastructure services; the application code (Flask API and Vue.js frontends) will still need to be run separately.

1.  Navigate to the root of the cloned `queue-management` directory in your terminal.
2.  Run the following command to start the infrastructure services in detached mode:
    ```bash
    docker-compose -f docker-compose.yml up -d
    ```
3.  Verify that the containers are running using `docker ps`. You should see `postgres`, `redis`, `keycloak`, and `minio` containers.
4.  After starting these services, you will still need to follow the instructions in **Step 5: Run the Applications** to get the API and frontend code running, likely on your host machine or within a separate development environment (e.g., a Python virtual environment for the API, and `npm run serve` for the frontends).

---

## Step 4: Initialize the Database

Once the container is built and you are in the remote VSCode session, you need to set up the PostgreSQL database schema and initial data.

1.  **Open a new Terminal** in VSCode (`Terminal > New Terminal`). You will be inside the dev container.

2.  **Create Database Tables:**
    If the database is empty, run the following command to create the tables:
    ```bash
    (cd api; .venv/bin/python manage.py db upgrade)
    ```

3.  **Seed the Database:**
    To populate the tables with essential default data, run the bootstrap command:
    ```bash
    (cd api; .venv/bin/python manage.py bootstrap)
    ```

---

## Step 5: Run the Applications

You have two options for running the application code (Flask API and Vue.js frontends), depending on how you set up your development environment in Step 3.

### Option 1: Using VSCode Launch Configurations (Recommended with Remote - Containers)

If you are using the VSCode Remote - Containers environment, you can leverage the pre-configured launch configurations:

1.  Navigate to the **Run and Debug** panel in VSCode (or press `Ctrl+Shift+D`).
2.  From the dropdown menu at the top, select one of the following launch configurations:
    *   **Queue Management**: Starts both the backend API and the main frontend. (Recommended)
    *   **queue_management_api**: Starts only the Python Flask API.
    *   **queue_management_frontend**: Starts only the Vue.js frontend.
    *   **appointment_frontend**: Starts the Vue.js appointment booking frontend.
3.  Press **F5** (or the green play button) to start the selected application(s).
4.  You can monitor the running applications and their exposed ports in the **PORTS** tab of the terminal panel.

> **Note:** The Vue.js frontend applications can take a long time to start up due to webpack bundling. The integrated terminal in VSCode may not show a progress indicator. You can monitor the `node` process CPU usage in the terminal (`top` command) to see when it has finished.

### Option 2: Manually Running Applications (If Using Docker Compose Manually)

If you started your infrastructure services manually using `docker-compose up -d` (Step 3, Option 2), you will need to run the API and frontend applications manually on your host machine.

#### Running the Flask API (`api` directory):

1.  Navigate to the `api` directory:
    ```bash
    cd api
    ```
2.  Create and activate a Python virtual environment (if you haven't already):
    ```bash
    python -m venv .venv
    .venv/scripts/activate  # On Windows PowerShell
    # source .venv/bin/activate # On Linux/Git Bash
    ```
3.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the Flask development server:
    ```bash
    python app.py
    python3 app.py #on Linux
    ```

#### Running the Vue.js Frontends (`frontend` and `appointment-frontend` directories):

For each frontend you want to run (e.g., `frontend` and `appointment-frontend`):

1.  Navigate to the respective frontend directory:
    ```bash
    cd frontend
    # or
    cd appointment-frontend
    ```
2.  Install Node.js dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run serve
    ```
    This will typically start the application on a local port (e.g., `http://localhost:8080` for `frontend`).

---

## Step 6: Access the Application

Once the applications are running, you can access them in your browser.

1.  To log in, find the **Keycloak Login** link at the bottom right-hand corner of the application's main page.
2.  You can use the following default credentials:
    *   **User:** `user` / **Password:** `user` (Regular Customer Service Representative)
    *   **User:** `admin` / **Password:** `admin` (Office Manager / Government Agent)

---

## Appendix: Running Tests

### Postman Tests

To run the Postman/Newman API tests:

1.  Ensure you have created the required test users in your Keycloak instance (`cfms-postman-operator`, `cfms-postman-non-operator`, `cfms-postman-public-user`) with appropriate roles.
2.  Navigate to the Postman directory:
    ```bash
    cd api/postman
    ```
3.  Install Newman:
    ```bash
    npm install newman
    ```
4.  Run the tests with the required environment variables. See `documentation/Readme.md` for a full example command.

### Jest Tests

To run the frontend Jest tests:

1.  From the `/workspace/frontend` directory, run:
    ```bash
    npm test
    ```
2.  This will open a Chromium browser and execute the end-to-end tests. Ensure you have set the required environment variables (`CFMS_DEV_URL`, `POSTMAN_OPERATOR_PASSWORD`) as described in `documentation/Readme.md`.

For more detailed information, refer to the [documentation/Readme.md](documentation/Readme.md) file.
