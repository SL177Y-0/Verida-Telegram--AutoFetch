const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Get the Verida network from environment variables
const VERIDA_NETWORK = process.env.VERIDA_NETWORK || 'testnet';
console.log(`Using Verida network: ${VERIDA_NETWORK}`);

// Define the CORRECT API endpoint based on the sandbox example
const VERIDA_API_BASE_URL = "https://api.verida.ai";
console.log(`Using Verida API endpoint: ${VERIDA_API_BASE_URL}`);

// The correct encoded schemas from the sandbox example
const GROUP_SCHEMA_ENCODED = 'aHR0cHM6Ly9jb21tb24uc2NoZW1hcy52ZXJpZGEuaW8vc29jaWFsL2NoYXQvZ3JvdXAvdjAuMS4wL3NjaGVtYS5qc29u';
const MESSAGE_SCHEMA_ENCODED = 'aHR0cHM6Ly9jb21tb24uc2NoZW1hcy52ZXJpZGEuaW8vc29jaWFsL2NoYXQvbWVzc2FnZS92MC4xLjAvc2NoZW1hLmpzb24=';

// Verida service for querying vault data
const veridaService = {
  // Get user DID using the auth token
  getUserDID: async (authToken) => {
    try {
      if (!authToken) {
        throw new Error('Auth token is required to fetch user DID');
      }

      console.log('Fetching user DID with auth token:', authToken.substring(0, 10) + '...');
      
      // The token might be already in the format from the examples:
      // {
      //   "token": {
      //     "did": "did:vda:mainnet:0xd9EEeE7aEbF2e035cb442223f8401C4E04a1Ed5B",
      //     "_id": "837a5a90-fa7b-11ef-aa6b-93971b55030c",
      //     "servers": ["https://api.verida.ai"],
      //     "scopes": ["api:ds-query", "ds:r:social-chat-message", "ds:r:social-chat-group"],
      //     "appDID": "did:vda:mainnet:0x87AE6A302aBf187298FC1Fa02A48cFD9EAd2818D"
      //   }
      // }

      // First try to use the default DID from .env if available
      if (process.env.DEFAULT_DID) {
        console.log('Using DEFAULT_DID from environment:', process.env.DEFAULT_DID);
        return process.env.DEFAULT_DID;
      }
      
      // If we can't get the DID from the environment, try an API call
      try {
        // Format auth header correctly - EXACTLY as shown in example
        const authHeader = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
        
        // Try to query for Telegram groups - this should fail if the token is invalid
        // but if it works, we know the token is valid
        const testResponse = await axios({
          method: 'POST',
          url: `${VERIDA_API_BASE_URL}/api/rest/v1/ds/query/${GROUP_SCHEMA_ENCODED}`,
          data: {
            options: {
              sort: [{ _id: "desc" }],
              limit: 1
            }
          },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          timeout: 5000 // 5 second timeout
        });
        
        console.log(`Test query response status:`, testResponse.status);
        
        // If we made it here, the auth token is valid, so we can use the default DID
        return process.env.DEFAULT_DID || 'unknown';
      } catch (apiError) {
        console.warn(`API test failed:`, apiError.message);
        // Continue and try the next option
      }
      
      // If we get here, we couldn't determine the DID
      return 'unknown';
    } catch (error) {
      console.error('Error determining DID:', error.message || error);
      return 'unknown'; // Fallback to unknown DID
    }
  },

  // Get Telegram data (groups and messages) from Verida vault
  getTelegramData: async (did, authToken) => {
    try {
      // For Verida API calls, we only need the auth token
      if (!authToken) {
        throw new Error('Auth token is required to query Verida vault');
      }
      
      console.log('Querying Verida with:', { did, authToken: authToken.substring(0, 10) + '...' });
      
      // Format auth header correctly - EXACTLY as shown in example
      const authHeader = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      
      // Use the exact same API schema and structure as shown in the sandbox
      let groups = 0;
      let messages = 0;
      
      try {
        // Query for Telegram chat groups using the exact format from the example
        const groupsResponse = await axios({
          method: 'POST',
          url: `${VERIDA_API_BASE_URL}/api/rest/v1/ds/query/${GROUP_SCHEMA_ENCODED}`,
          data: {
            options: {
              sort: [{ _id: "desc" }],
              limit: 100
            }
          },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          timeout: 10000 // 10 second timeout
        });
        
        // Query for Telegram chat messages using the exact format from the example
        const messagesResponse = await axios({
          method: 'POST',
          url: `${VERIDA_API_BASE_URL}/api/rest/v1/ds/query/${MESSAGE_SCHEMA_ENCODED}`,
          data: {
            options: {
              sort: [{ _id: "desc" }],
              limit: 100
            }
          },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          timeout: 10000 // 10 second timeout
        });
        
        // Log response samples for debugging
        console.log('Groups response:', 
          groupsResponse.data?.results ? 
            `Found ${groupsResponse.data.results.length} groups` :
            'No groups found'
        );
        
        console.log('Messages response:', 
          messagesResponse.data?.results ? 
            `Found ${messagesResponse.data.results.length} messages` :
            'No messages found'
        );
        
        // Extract data from responses
        groups = groupsResponse.data?.results?.length || 0;
        messages = messagesResponse.data?.results?.length || 0;
      } catch (queryError) {
        console.error('Error querying Verida:', queryError.message);
        // If the direct query fails, we can try the universal search instead
        
        try {
          // Try universal search as a fallback
          const searchResponse = await axios({
            method: 'GET',
            url: `${VERIDA_API_BASE_URL}/api/rest/v1/search/universal?keywords=telegram`,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader
            },
            timeout: 10000 // 10 second timeout
          });
          
          if (searchResponse.data && searchResponse.data.items) {
            const telegramItems = searchResponse.data.items.filter(item => 
              item.schema?.includes('chat/group') || 
              item.schema?.includes('chat/message') || 
              item.name?.toLowerCase().includes('telegram')
            );
            
            console.log(`Found ${telegramItems.length} Telegram-related items in search results`);
            
            // Set the counts based on the search results
            groups = telegramItems.filter(item => item.schema?.includes('chat/group')).length;
            messages = telegramItems.filter(item => item.schema?.includes('chat/message')).length;
          }
        } catch (searchError) {
          console.error('Search also failed:', searchError.message);
        }
      }
      
      return {
        groups,
        messages
      };
    } catch (error) {
      console.error('Error querying Verida vault:', error.message || error);
      return {
        groups: 0,
        messages: 0
      };
    }
  }
};

module.exports = veridaService;