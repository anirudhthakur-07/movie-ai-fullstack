# 🔌 DARK AI Platform — API Manual

This document provides request/response schemas and authentication specifications for the **DARK API**.

---

## 1. Authentication Specs

All protected endpoints require a signed JWT token provided in the HTTP Authorization header:
`Authorization: Bearer <your_jwt_token>`

---

## 2. API Endpoint Directory

### Authentication Endpoints

#### `POST /api/auth/register`
*   **Access:** Public
*   **Description:** Creates a new user profile.
*   **Request Payload:**
    ```json
    {
      "username": "cinephile99",
      "email": "user@example.com",
      "password": "securepassword123"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "message": "User registered successfully",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```

#### `POST /api/auth/login`
*   **Access:** Public
*   **Description:** Authenticates credentials and returns a JWT session token.
*   **Request Payload:**
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword123"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```

---

### Nyx Core AI Endpoint

#### `POST /api/nyx/chat`
*   **Access:** JWT Protected
*   **Description:** Submit a query to Nyx (returns streaming chunks).
*   **Request Payload:**
    ```json
    {
      "message": "Recommend some action movies",
      "history": []
    }
    ```
*   **Response (200 OK - Server-Sent Events stream):**
    ```text
    data: {"chunk": "Based on "}
    data: {"chunk": "your profile, I recommend "}
    data: {"chunk": "Inception."}
    data: [DONE]
    ```

---

### Watchlist & Curation Endpoints

#### `GET /api/watchlist`
*   **Access:** JWT Protected
*   **Description:** Retrieves the user's watchlist array.
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "27205",
        "title": "Inception",
        "poster_path": "/qmDp59hMRZuLY0Yccg5g6tHNIa1.jpg",
        "genres": ["Action", "Sci-Fi", "Adventure"]
      }
    ]
    ```

#### `POST /api/watchlist/add`
*   **Access:** JWT Protected
*   **Description:** Adds a movie item to the user's watchlist.
*   **Request Payload:**
    ```json
    {
      "id": "27205",
      "title": "Inception",
      "poster_path": "/qmDp59hMRZuLY0Yccg5g6tHNIa1.jpg",
      "genres": ["Action", "Sci-Fi", "Adventure"]
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Movie added to watchlist",
      "watchlistCount": 1
    }
    ```

---

### Slack Integration Webhooks

#### `POST /api/slack/commands`
*   **Access:** HMAC Signature Protected
*   **Description:** Receives and processes slash commands (`/nyx`).
*   **Request Headers Required:**
    *   `x-slack-signature`
    *   `x-slack-request-timestamp`
*   **Request Payload (Urlencoded from Slack):**
    ```text
    token=gIkuvaNzQIHg97ATvDxqgjtO&team_id=T0001&channel_id=C2147483705&user_id=U2147483697&command=%2Fnyx&text=recommend+sci-fi
    ```
*   **Response (200 OK - Block Kit JSON):**
    ```json
    {
      "response_type": "in_channel",
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Based on your Taste DNA, here are your recommendations:"
          }
        }
      ]
    }
    ```
