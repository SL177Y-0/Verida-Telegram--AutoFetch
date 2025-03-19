require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const axios = require('axios');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(morgan('dev'));

// In-memory storage for auth tokens
const userTokens = {};

// Helper function for base64 encoding (Node.js equivalent of btoa)
function btoa(str) {
  return Buffer.from(str).toString('base64');
}

// ===== AUTH ROUTES =====

// Generate auth URL for Verida connection
app.get('/api/auth/url', (req, res) => {
  try {
    // Define scopes needed for Telegram data
    const scopesList = [
      'api:ds-query',
      'api:search-universal',
      'ds:social-email',
      'api:connections-profiles',
      'api:connections-status',
      'api:db-query',
      'api:ds-get-by-id',
      'api:db-get-by-id',
      'api:ds-update',
      'api:search-ds',
      'api:search-chat-threads',
      'ds:r:social-chat-group',
      'ds:r:social-chat-message'
    ];
    
    // Generate the auth URL using the same format as the provided URL
    const redirectUrl = process.env.REDIRECT_URL;
    const appDID = 'did:vda:mainnet:0x87AE6A302aBf187298FC1Fa02A48cFD9EAd2818D';
    
    // Construct URL with multiple scope parameters
    let authUrl = 'https://app.verida.ai/auth?';
    
    // Add each scope individually
    scopesList.forEach(scope => {
      authUrl += `scopes=${encodeURIComponent(scope)}&`;
    });
    
    // Add redirect URL and appDID
    authUrl += `redirectUrl=${encodeURIComponent(redirectUrl)}&appDID=${appDID}`;
    
    console.log('Generated auth URL:', authUrl);
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle callback with auth token
app.get('/auth/callback', (req, res) => {
  try {
    const { auth_token } = req.query;
    
    if (!auth_token) {
      return res.status(400).json({ success: false, error: 'No auth token provided' });
    }
    
    // Store token (in a real app, associate with user session/ID)
    const userId = 'user-' + Date.now();
    userTokens[userId] = auth_token;
    console.log('Stored auth token for user:', userId);
    
    // Redirect to frontend with success
    res.redirect(`/?status=success&userId=${userId}`);
  } catch (error) {
    console.error('Error processing auth callback:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== TELEGRAM DATA ROUTES =====

// Get Telegram groups
app.get('/api/telegram/groups', async (req, res) => {
  try {
    const { userId } = req.query;
    const authToken = userTokens[userId];
    
    if (!authToken) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    
    // Use the correct schema URL and encode it in base64
    const schemaUrl = 'https://common.schemas.verida.io/social/chat/group/v0.1.0/schema.json';
    const schemaUrlEncoded = btoa(schemaUrl);
    
    console.log('Making request to:', `${process.env.API_ENDPOINT}/ds/query/${schemaUrlEncoded}`);
    
    // Make request to Verida API with POST to ds/query
    const response = await axios({
      method: 'POST',
      url: `${process.env.API_ENDPOINT}/ds/query/${schemaUrlEncoded}`,
      data: {
        query: {
          sourceApplication: "https://telegram.com"
        },
        options: {
          sort: [{ _id: "desc" }],
          limit: 100000
          
          
        }
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // Log the response for debugging
    console.log('API Response:', JSON.stringify(response.data, null, 2));
    
    // Check if response.data exists and has the expected structure
    const groups = response.data && response.data.items ? response.data.items : [];
    console.log(`Fetched ${groups.length} Telegram groups`);
    
    res.json({ 
      success: true, 
      count: groups.length,
      groups: groups,
      responseData: response.data // Include the full response for debugging
    });
  } catch (error) {
    console.error('Error fetching Telegram groups:', error);
    
    // Log more details if it's an Axios error
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Telegram messages
app.get('/api/telegram/messages', async (req, res) => {
  try {
    const { userId } = req.query;
    const authToken = userTokens[userId];
    
    if (!authToken) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    
    // Use the correct schema URL and encode it in base64
    const schemaUrl = 'https://common.schemas.verida.io/social/chat/message/v0.1.0/schema.json';
    const schemaUrlEncoded = btoa(schemaUrl);
    
    console.log('Making request to:', `${process.env.API_ENDPOINT}/ds/query/${schemaUrlEncoded}`);
    
    // Make request to Verida API with POST to ds/query
    const response = await axios({
      method: 'POST',
      url: `${process.env.API_ENDPOINT}/ds/query/${schemaUrlEncoded}`,
      data: {
        query: {
          sourceApplication: "https://telegram.com"
        },
        options: {
          sort: [{ _id: "desc" }],
          limit: 100000
        }
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // Log the response for debugging
    console.log('API Response:', JSON.stringify(response.data, null, 2));
    
    // Check if response.data exists and has the expected structure
    const messages = response.data && response.data.items ? response.data.items : [];
    console.log(`Fetched ${messages.length} Telegram messages`);
    
    res.json({ 
      success: true, 
      count: messages.length,
      messages: messages,
      responseData: response.data // Include the full response for debugging
    });
  } catch (error) {
    console.error('Error fetching Telegram messages:', error);
    
    // Log more details if it's an Axios error
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get keyword stats for messages (counts for specified keywords)
app.get('/api/telegram/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    const authToken = userTokens[userId];
    
    if (!authToken) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    
    // Get counts for groups and messages using the dedicated count endpoint
    const groupSchemaUrl = 'https://common.schemas.verida.io/social/chat/group/v0.1.0/schema.json';
    const messageSchemaUrl = 'https://common.schemas.verida.io/social/chat/message/v0.1.0/schema.json';
    
    const groupCount = await getDatastoreCount(authToken, groupSchemaUrl);
    
    // Get all messages to analyze keywords
    const schemaUrl = 'https://common.schemas.verida.io/social/chat/message/v0.1.0/schema.json';
    const schemaUrlEncoded = btoa(schemaUrl);
    
    console.log('Making message request to:', `${process.env.API_ENDPOINT}/ds/query/${schemaUrlEncoded}`);
    
    const response = await axios({
      method: 'POST',
      url: `${process.env.API_ENDPOINT}/ds/query/${schemaUrlEncoded}`,
      data: {
        query: {
          sourceApplication: "https://telegram.com"
        },
        options: {
          sort: [{ _id: "desc" }],
          limit: 200
        }
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // Log the response for debugging
    console.log('API Messages Response:', JSON.stringify(response.data, null, 2));
    
    // Check if response.data exists and has the expected structure
    const messages = response.data && response.data.items ? response.data.items : [];
    
    // Count keywords
    const keywords = ['cluster', 'protocol', 'ai', 'defi', 'crypto', 'web3'];
    const keywordCounts = {};
    
    keywords.forEach(keyword => {
      const lowercaseKeyword = keyword.toLowerCase();
      keywordCounts[keyword] = messages.filter(msg => {
        const messageText = msg.messageText || '';
        return messageText.toLowerCase().includes(lowercaseKeyword);
      }).length;
    });
    
    // Get the message count from the count endpoint for accuracy
    const messageCount = await getDatastoreCount(authToken, messageSchemaUrl);
    
    res.json({
      success: true,
      stats: {
        groups: {
          count: groupCount
        },
        messages: {
          count: messageCount,
          keywordCounts
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Telegram stats:', error);
    
    // Log more details if it's an Axios error
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// Function to get count from a datastore
async function getDatastoreCount(authToken, schemaUrl) {
  try {
    const schemaUrlEncoded = btoa(schemaUrl);
    console.log(`Making count request to: ${process.env.API_ENDPOINT}/ds/count/${schemaUrlEncoded}`);
    
    const response = await axios({
      method: 'POST',
      url: `${process.env.API_ENDPOINT}/ds/count/${schemaUrlEncoded}`,
      data: {
        query: {
          sourceApplication: "https://telegram.com"
        }
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('Count API Response:', JSON.stringify(response.data, null, 2));
    return response.data && response.data.count ? response.data.count : 0;
  } catch (error) {
    console.error(`Error getting count for ${schemaUrl}:`, error);
    return 0;
  }
}

// Get Telegram stats using the count endpoint
app.get('/api/telegram/count', async (req, res) => {
  try {
    const { userId } = req.query;
    const authToken = userTokens[userId];
    
    if (!authToken) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    
    // Get counts for groups and messages using the dedicated count endpoint
    const groupSchemaUrl = 'https://common.schemas.verida.io/social/chat/group/v0.1.0/schema.json';
    const messageSchemaUrl = 'https://common.schemas.verida.io/social/chat/message/v0.1.0/schema.json';
    
    const groupCount = await getDatastoreCount(authToken, groupSchemaUrl);
    const messageCount = await getDatastoreCount(authToken, messageSchemaUrl);
    
    res.json({
      success: true,
      counts: {
        groups: groupCount,
        messages: messageCount
      }
    });
  } catch (error) {
    console.error('Error fetching Telegram counts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using API endpoint: ${process.env.API_ENDPOINT}`);
}); 