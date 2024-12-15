# Project Setup Guide

This guide provides detailed instructions on how to set up the React-based Chrome extension built using Vite and the NestJS backend server.

## Prerequisites

Before you start, ensure you have the following installed:

-   Node.js and npm (Node Package Manager): Download and install them from the [Node.js official website](https://nodejs.org/).
-   Google Chrome: Needed for adding and testing the Chrome extension.
-   MongoDB: Required for the backend server database. You can choose to install MongoDB locally or use MongoDB Atlas for a managed database solution.
-   Open AI API key: You will need an OpenAI account and API key. You will need to add funds to your account.

## Chrome Extension Setup (`/chrome-extension` Directory)

### Initial Preparation of the Chrome Extension

This inital setup is to obtain a chrome extension id which is required to generate a client id and key for google oauth services.

1. Navigate to the `/chrome-extension` directory:
    ```sh
    cd chrome-extension
    ```
2. Install the necessary npm packages:
    ```sh
    npm install
    ```
3. Open the `/public/manifest.json` file and temporarily remove or comment out the `oauth2` and `key` properties. Your `manifest.json` should look something like this:
    ```json
    {
        "manifest_version": 3,
        "name": "Gmail Labeler",
        "description": "Automatically label Gmail emails.",
        "version": "1.0",
        "permissions": [
            "identity",
            "storage",
            "activeTab",
            "scripting",
            "alarms"
        ],
        "host_permissions": ["https://mail.google.com/*"],
        "background": {
            "service_worker": "service-worker.js"
        },
        "action": {
            "default_popup": "index.html",
            "default_icon": "label.png"
        }
    }
    ```
4. Build the extension:
    ```sh
    npm run build
    ```

### Loading the Extension in Developer Mode

1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch at the top right corner.
4. Click on "Load unpacked" and select the `/chrome-extension/build` directory.
5. **IMPORTANT:** Note the ID that Chrome assigns to your extension. This extension ID is required for setting up OAuth credentials.

### Setting up Gmail API and OAuth Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to "APIs & Services > Dashboard" and enable the Gmail API for your project.
4. Go to "APIs & Services > Credentials", click on "Create Credentials", and select "OAuth client ID".
5. Set the application type to "Chrome App" and enter the extension ID you noted earlier.
6. Note the client ID and any provided key.

### Updating the Manifest File

1. Return to your `manifest.json` file and re-add the `oauth2` block and the `key`. Update it to include your new client ID and key:
    ```json
    {
        "manifest_version": 3,
        "name": "Gmail Labeler",
        "description": "Automatically label Gmail emails.",
        "version": "1.0",
        "permissions": [
            "identity",
            "storage",
            "activeTab",
            "scripting",
            "alarms"
        ],
        "host_permissions": ["https://mail.google.com/*"],
        "background": {
            "service_worker": "service-worker.js"
        },
        "oauth2": {
            "client_id": "YOUR_NEW_CLIENT_ID",
            "scopes": [
                "https://www.googleapis.com/auth/gmail.modify",
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email"
            ]
        },
        "action": {
            "default_popup": "index.html",
            "default_icon": "label.png"
        },
        "key": "YOUR_NEW_KEY"
    }
    ```
2. Save the changes and rebuild the extension:
    ```sh
    npm run build
    ```
3. Reload the unpacked extension in `chrome://extensions/` to apply changes.

The final version of the extension should now be built and loaded into your google chrome browser. It is not ready to use as you must first add test users for it in google cloud, and spin up the backend/server.

### Configuring Test Users

1. Back in the Google Cloud Console API's & Services section, navigate to the "OAuth consent screen" tab.
2. Under the "Test users" section, click on "Add Users".
3. Enter the email addresses of the Google accounts that will be used to test the Chrome extension.
4. These users will be able to log in and use the extension with OAuth functionalities.

## Backend Server Setup (`/server` Directory)

### MongoDB Setup

#### Option 1: Install MongoDB Locally

-   **Download and Install**: Visit the [MongoDB official website](https://www.mongodb.com/try/download/community) and download the version suitable for your operating system. Follow their installation guide.
-   **Configure MongoDB**: Set up your MongoDB environment by creating a database and a user. Details can be found in the [MongoDB security documentation](https://docs.mongodb.com/manual/security/).

#### Option 2: Use MongoDB Atlas

-   **Set Up MongoDB Atlas**: Register and set up a cluster in MongoDB Atlas by following their guide on the [MongoDB Atlas website](https://www.mongodb.com/cloud/atlas/register).

#### Obtain Connection URI

-   **Connection URI**: For detailed instructions on obtaining the MongoDB connection URI, refer to the [MongoDB URI documentation](https://docs.mongodb.com/manual/reference/connection-string/).

### Environment Configuration

1. Navigate to the `/server` directory:
    ```sh
    cd server
    ```
2. Create a `.env` file to store your environment variables:
    ```plaintext
    MONGO_URI=<mongo_db_connection_uri>
    GMAIL_API_KEY=<google_oauth_client_id>
    LLM_API_KEY=<open_ai_api_key>
    ```
    Replace `<mongo_db_connection_uri>`, `<google_oauth_client_id>`, and `<open_ai_api_key>` with your MongoDB URI, Google Cloud OAuth client ID, and OpenAI API key, respectively.

### Installing Dependencies

1. Install the required npm packages:
    ```sh
    npm install
    ```

### Running the Server

1. Start the server:
    ```sh
    npm run start
    ```

The application should now be fully operational. Click on the brower extension to add filtering rules.

## Additional Information

-   **NestJS Documentation**: For more details on working with NestJS, visit the [official NestJS documentation](https://nestjs.com/).
-   **React and Vite Documentation**: Learn more about React and Vite by visiting their official documentation pages at [React documentation](https://reactjs.org/) and [Vite documentation](https://vitejs.dev/).
-   **Chrome Extensions Development**: For more guidance on developing Chrome extensions, refer to the [Chrome Developers documentation](https://developer.chrome.com/docs/extensions/mv3/getstarted/).