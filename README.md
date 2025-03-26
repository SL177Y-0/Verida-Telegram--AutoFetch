# Verida Telegram Integration

A simple Node.js application for integrating with Verida to access and analyze Telegram data.

## Preview

   ![Video]("https://github.com/SL177Y-0/Verida-Telegram--AutoFetch/blob/main/public/Demo.mp4")

   
## Features

- Connect to Verida account with OAuth flow
- Fetch Telegram groups and messages
- Analyze messages for specific keywords (cluster, protocol, ai, defi, crypto, web3)
- Search messages by custom keywords
- Simple, clean UI to display data and statistics

## Flow

1. User presses connect button
2. User is redirected to Verida auth page 
3. User grants access to their Telegram data
4. Callback to our app with auth token
5. App uses token to query Verida for Telegram data
6. Display group and message counts, keyword analysis in UI

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables (in `.env` file):
   ```
   PORT=3000
   REDIRECT_URL=http://localhost:3000/auth/callback
   API_ENDPOINT=https://api.verida.ai/api/rest/v1
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open your browser to `http://localhost:3000`

## Prerequisites

- Node.js (v14 or higher)
- User must have a Verida account
- User must have connected their Telegram account to Verida

## API Endpoints

- `GET /api/auth/url` - Generate Verida authentication URL
- `GET /auth/callback` - Callback endpoint for Verida auth
- `GET /api/telegram/groups` - Get user's Telegram groups
- `GET /api/telegram/messages` - Get user's Telegram messages
- `GET /api/telegram/search` - Search messages by keyword
- `GET /api/telegram/stats` - Get message and group statistics

## Notes

- This is a sample application intended for demonstration purposes
- Auth tokens are stored in memory (would use a database in production)
- Base64 encoding is used for schema URLs as required by Verida API 