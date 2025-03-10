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

// Keywords to check for "Engage Bonus"
const ENGAGE_KEYWORDS = ['cluster', 'protocol', 'ai'];

// Helper function to test multiple Verida API endpoints
async function testVeridaEndpoints(authToken) {
  const endpoints = [
    '/api/profile',
    '/api/user/info',
    '/v1/user',
    '/user',
    '/profile'
  ];
  
  console.log('Testing Verida endpoints with token:', authToken.substring(0, 10) + '...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${VERIDA_API_BASE_URL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      console.log(`✅ Endpoint ${endpoint} succeeded:`, response.status);
      console.log('Response data keys:', Object.keys(response.data || {}));
      
      if (response.data?.did) {
        console.log('DID found in response:', response.data.did);
        return response.data.did;
      }
    } catch (error) {
      console.log(`❌ Endpoint ${endpoint} failed:`, error.message);
      console.log('Status:', error.response?.status);
    }
  }
  return null;
}

// Helper function to check for keywords in text content
function checkForKeywords(text, keywordMatches) {
  if (!text) return;
  
  const normalizedText = text.toLowerCase();
  
  ENGAGE_KEYWORDS.forEach(keyword => {
    // Match whole words, case insensitive, including:
    // - Within sentences
    // - In capital letters
    // - In hashtags (#keyword)
    // - Multiple keywords in same text
    
    let searchPos = 0;
    const lowerKeyword = keyword.toLowerCase();
    
    while (true) {
      const foundPos = normalizedText.indexOf(lowerKeyword, searchPos);
      if (foundPos === -1) break;
      
      // Check if it's a whole word or hashtag match
      const isWordStart = foundPos === 0 || 
        !normalizedText[foundPos-1].match(/[a-z0-9]/) || 
        normalizedText[foundPos-1] === '#';
        
      const isWordEnd = foundPos + lowerKeyword.length >= normalizedText.length || 
        !normalizedText[foundPos + lowerKeyword.length].match(/[a-z0-9]/);
      
      if (isWordStart && isWordEnd) {
        keywordMatches.keywords[keyword]++;
        keywordMatches.totalCount++;
        console.log(`Keyword match: '${keyword}' at position ${foundPos} in text: "${text.substring(Math.max(0, foundPos-10), Math.min(text.length, foundPos+keyword.length+10))}..."`);
        break; // Count each keyword only once per text
      }
      
      searchPos = foundPos + 1;
    }
  });
}

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
      
      // Try the new testing function for all endpoints
      const didFromTests = await testVeridaEndpoints(authToken);
      if (didFromTests) {
        return didFromTests;
      }
      
      // Try to get user profile info with the standard endpoint
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

      // Try a different API endpoint format
      try {
        const newEndpointResponse = await axios({
          method: 'GET',
          url: `${VERIDA_API_BASE_URL}/v1/user`,  // Try this endpoint instead
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        if (newEndpointResponse.data?.did) {
          console.log('Retrieved DID from v1/user endpoint:', newEndpointResponse.data.did);
          return newEndpointResponse.data.did;
        }
      } catch (newEndpointError) {
        console.warn('v1/user endpoint lookup failed:', newEndpointError.message);
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
      let groupItems = [];
      let messageItems = [];
      let keywordMatches = {
        totalCount: 0,
        keywords: {}
      };
      
      // Initialize keyword counts
      ENGAGE_KEYWORDS.forEach(keyword => {
        keywordMatches.keywords[keyword] = 0;
      });
      
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
          // Fetch group data
          const groupResponse = await axios({
            method: 'POST',
            url: `${VERIDA_API_BASE_URL}/api/rest/v1/ds/query/${GROUP_SCHEMA_ENCODED}`,
            data: {
              options: {
                sort: [{ _id: "desc" }],
                limit: 1000
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
                limit: 1000
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
          
          // Check for keywords in group content
          if (groupItems.length > 0) {
            console.log('Checking group content for keywords...');
            groupItems.forEach(group => {
              const groupText = [
                group.name || '', 
                group.description || '',
                group.subject || ''
              ].join(' ');
              
              if (groupText.trim()) {
                checkForKeywords(groupText, keywordMatches);
              }
            });
          }
          
          // Enhanced message content checking
          if (messageItems.length > 0) {
            console.log('Checking message content for keywords...');
            messageItems.forEach(message => {
              // Log the entire message object structure to debug
              console.log('Message object keys:', Object.keys(message));
              
              // Try to get message content from any possible field
              let allTextFields = [];
              
              // Add all string fields from the message object
              Object.entries(message).forEach(([key, value]) => {
                if (typeof value === 'string') {
                  allTextFields.push(value);
                } else if (typeof value === 'object' && value !== null) {
                  // Check nested objects (like "body" or "data")
                  Object.values(value).forEach(nestedValue => {
                    if (typeof nestedValue === 'string') {
                      allTextFields.push(nestedValue);
                    }
                  });
                }
              });
              
              const messageText = allTextFields.join(' ');
              
              if (messageText.trim()) {
                checkForKeywords(messageText, keywordMatches);
              }
            });
          }
          
          console.log(`Found ${keywordMatches.totalCount} total keyword matches`);
          for (const [keyword, count] of Object.entries(keywordMatches.keywords)) {
            if (count > 0) {
              console.log(`- '${keyword}': ${count} matches`);
            }
          }
        } catch (queryError) {
          console.error('Query API failed:', queryError.message);
          
          // Last resort: try universal search for each keyword
          console.log('Trying keyword-specific searches...');
          try {
            for (const keyword of ENGAGE_KEYWORDS) {
              try {
                const keywordResponse = await axios({
                  method: 'GET',
                  url: `${VERIDA_API_BASE_URL}/api/rest/v1/search/universal?keywords=${keyword}`,
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                  },
                  timeout: 10000
                });
                
                if (keywordResponse.data?.items && Array.isArray(keywordResponse.data.items)) {
                  const matchCount = keywordResponse.data.items.filter(item => 
                    (item.schema?.includes('chat/group') || item.schema?.includes('chat/message'))
                  ).length;
                  
                  keywordMatches.keywords[keyword] = matchCount;
                  keywordMatches.totalCount += matchCount;
                  
                  console.log(`Search for '${keyword}' found ${matchCount} matches`);
                }
              } catch (keywordError) {
                console.warn(`Search for keyword '${keyword}' failed:`, keywordError.message);
              }
            }
          } catch (searchError) {
            console.error('Keyword searches failed:', searchError.message);
          }
          
          // If we still have no group/message counts, try universal search for telegram
          if (groups === 0 && messages === 0) {
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
              console.error('Telegram search also failed:', searchError.message);
            }
          }
        }
      }
      
      return {
        groups,
        messages,
        keywordMatches
      };
    } catch (error) {
      console.error('Error querying Verida vault:', error.message || error);
      throw error;
    }
  }
};

module.exports = veridaService;