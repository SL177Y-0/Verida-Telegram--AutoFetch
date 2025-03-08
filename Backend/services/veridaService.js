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
const MESSAGE_SCHEMA_ENCODED = 'aHR0cHM6Ly9jb21tb24uc2NoZW1hcy52ZXJpZGEuaW8vc29jaWFsL2NoYXQvbWVzc2FnZS92MC4xLjAvc2NoZW1hLmpzb24%3D';

// Verida service for querying vault data
const veridaService = {
  // Get user DID using the auth token
  getUserDID: async (authToken) => {
    try {
      if (!authToken) {
        throw new Error('Auth token is required to fetch user DID');
      }

      console.log('Fetching user DID with auth token:', authToken.substring(0, 10) + '...');
      
      // Parse token if it's a JSON structure (Verida sometimes returns this format)
      let tokenObj = authToken;
      if (typeof authToken === 'string') {
        // If the token is a string, check if it's JSON or a Bearer token
        if (authToken.startsWith('{')) {
          try {
            tokenObj = JSON.parse(authToken);
          } catch (e) {
            // Not JSON, keep as-is
          }
        }
      }
      
      // Extract DID from token object if present
      if (tokenObj.token && tokenObj.token.did) {
        console.log('Extracted DID from token object:', tokenObj.token.did);
        return tokenObj.token.did;
      }

      // Format auth header correctly
      const authHeader = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
      
      // Try to get user profile info
      try {
        const profileResponse = await axios({
          method: 'GET',
          url: `${VERIDA_API_BASE_URL}/api/profile`,
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        if (profileResponse.data?.did) {
          console.log('Retrieved DID from profile:', profileResponse.data.did);
          return profileResponse.data.did;
        }
      } catch (profileError) {
        console.warn('Profile lookup failed:', profileError.message);
      }

      // Try to get user info through alternative endpoint
      try {
        const userInfoResponse = await axios({
          method: 'GET',
          url: `${VERIDA_API_BASE_URL}/api/user/info`,
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        if (userInfoResponse.data?.did) {
          console.log('Retrieved DID from user info:', userInfoResponse.data.did);
          return userInfoResponse.data.did;
        }
      } catch (userInfoError) {
        console.warn('User info lookup failed:', userInfoError.message);
      }
      
      // As a last resort, use the default DID from .env
      if (process.env.DEFAULT_DID) {
        console.warn('Using DEFAULT_DID as fallback - not ideal for production');
        return process.env.DEFAULT_DID;
      }
      
      throw new Error('Could not determine user DID');
    } catch (error) {
      console.error('Error determining DID:', error.message || error);
      throw error;
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
      
      // First try direct count API
      let groups = 0;
      let messages = 0;
      
      console.log('Trying direct count API...');
      try {
        const groupsCountResponse = await axios({
          method: 'POST',
          url: `${VERIDA_API_BASE_URL}/api/rest/v1/ds/count/${GROUP_SCHEMA_ENCODED}`,
          data: {},
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          timeout: 10000
        });
        
        const messagesCountResponse = await axios({
          method: 'POST',
          url: `${VERIDA_API_BASE_URL}/api/rest/v1/ds/count/${MESSAGE_SCHEMA_ENCODED}`,
          data: {},
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          timeout: 10000
        });
        
        groups = groupsCountResponse.data?.count || 0;
        messages = messagesCountResponse.data?.count || 0;
        
        console.log(`Direct count API results: ${groups} groups, ${messages} messages`);
      } catch (countError) {
        console.log('Count API failed:', countError.message);
        
        // Fall back to query API
        console.log('Trying direct query API...');
        try {
          // Use pagination to get all groups and messages
          async function fetchAllItems(schemaEncoded) {
            let allItems = [];
            let hasMore = true;
            let skip = 0;
            const limit = 100;
            
            while (hasMore) {
              const response = await axios({
                method: 'POST',
                url: `${VERIDA_API_BASE_URL}/api/rest/v1/ds/query/${schemaEncoded}`,
                data: {
                  options: {
                    sort: [{ _id: "desc" }],
                    limit: limit,
                    skip: skip
                  }
                },
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': authHeader
                },
                timeout: 15000
              });
              
              // Check response format - Verida may return items in different places
              let items = [];
              if (response.data?.results && Array.isArray(response.data.results)) {
                items = response.data.results;
              } else if (response.data?.items && Array.isArray(response.data.items)) {
                items = response.data.items;
              }
              
              if (items.length === 0) {
                console.log(`No items found for this schema (${schemaEncoded.substring(0, 10)}...)`);
                
                // Log response structure for debugging
                console.log('Response keys:', Object.keys(response.data || {}));
                hasMore = false;
              } else {
                allItems = allItems.concat(items);
                console.log(`Fetched ${items.length} items, total: ${allItems.length}`);
                
                if (items.length < limit) {
                  hasMore = false;
                } else {
                  skip += limit;
                }
              }
            }
            
            return allItems;
          }
          
          // Fetch group data
          const groupResponse = await axios({
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
            timeout: 10000
          });
          
          // Fetch message data
          const messageResponse = await axios({
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
            timeout: 10000
          });
          
          // Check response format for groups
          console.log('Groups query results:', 
            groupResponse.data?.results ? 
              `Found ${groupResponse.data.results.length} results` : 
              `No results array (keys: ${Object.keys(groupResponse.data || {}).join(', ')})`
          );
          
          // Check response format for messages
          console.log('Messages query results:', 
            messageResponse.data?.results ? 
              `Found ${messageResponse.data.results.length} results` : 
              `No results array (keys: ${Object.keys(messageResponse.data || {}).join(', ')})`
          );
          
          // Extract data based on response format
          let groupItems = [];
          let messageItems = [];
          
          if (groupResponse.data?.results && Array.isArray(groupResponse.data.results)) {
            groupItems = groupResponse.data.results;
          } else if (groupResponse.data?.items && Array.isArray(groupResponse.data.items)) {
            groupItems = groupResponse.data.items;
            console.log(`Found ${groupItems.length} groups in 'items' array`);
          }
          
          if (messageResponse.data?.results && Array.isArray(messageResponse.data.results)) {
            messageItems = messageResponse.data.results;
          } else if (messageResponse.data?.items && Array.isArray(messageResponse.data.items)) {
            messageItems = messageResponse.data.items;
            console.log(`Found ${messageItems.length} messages in 'items' array`);
          }
          
          groups = groupItems.length;
          messages = messageItems.length;
          
          // If we're hitting the limit, use pagination to get total counts
          if (groups === 100 || messages === 100) {
            console.log('Detected limit reached, using pagination to get full counts');
            // For now, we'll use the limited counts to avoid overloading the API
            // Uncomment these lines to get full counts
            // const allGroups = await fetchAllItems(GROUP_SCHEMA_ENCODED);
            // const allMessages = await fetchAllItems(MESSAGE_SCHEMA_ENCODED);
            // groups = allGroups.length;
            // messages = allMessages.length;
          }
        } catch (queryError) {
          console.error('Query API failed:', queryError.message);
          
          // Last resort: try universal search
          try {
            const searchResponse = await axios({
              method: 'GET',
              url: `${VERIDA_API_BASE_URL}/api/rest/v1/search/universal?keywords=telegram`,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
              },
              timeout: 10000
            });
            
            if (searchResponse.data?.items && Array.isArray(searchResponse.data.items)) {
              const telegramItems = searchResponse.data.items.filter(item => 
                (item.schema?.includes('chat/group') || 
                 item.schema?.includes('chat/message') || 
                 (item.name && item.name.toLowerCase().includes('telegram')))
              );
              
              console.log(`Found ${telegramItems.length} Telegram-related items in search`);
              
              // Set the counts based on the search results
              groups = telegramItems.filter(item => 
                item.schema?.includes('chat/group')
              ).length;
              
              messages = telegramItems.filter(item => 
                item.schema?.includes('chat/message')
              ).length;
              
              console.log(`Search results: ${groups} groups, ${messages} messages`);
            }
          } catch (searchError) {
            console.error('Search also failed:', searchError.message);
          }
        }
      }
      
      return {
        groups,
        messages
      };
    } catch (error) {
      console.error('Error querying Verida vault:', error.message || error);
      throw error;
    }
  }
};

module.exports = veridaService;