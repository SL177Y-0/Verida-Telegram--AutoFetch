document.addEventListener('DOMContentLoaded', function() {
  // UI Elements
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const connectBtn = document.getElementById('connect-btn');
  const fetchGroupsBtn = document.getElementById('fetch-groups-btn');
  const fetchMessagesBtn = document.getElementById('fetch-messages-btn');
  const fetchStatsBtn = document.getElementById('fetch-stats-btn');
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');
  
  // Data display elements
  const groupCount = document.getElementById('group-count');
  const messageCount = document.getElementById('message-count');
  const searchCount = document.getElementById('search-count');
  const groupsJson = document.getElementById('groups-json');
  const messagesJson = document.getElementById('messages-json');
  const searchResults = document.getElementById('search-results');
  const searchResultsContainer = document.getElementById('search-results-container');
  
  // Keyword count elements
  const clusterCount = document.getElementById('cluster-count');
  const protocolCount = document.getElementById('protocol-count');
  const aiCount = document.getElementById('ai-count');
  const defiCount = document.getElementById('defi-count');
  const cryptoCount = document.getElementById('crypto-count');
  const web3Count = document.getElementById('web3-count');
  
  // Current user state
  let currentUserId = null;
  
  // Check URL params for auth callback
  function checkAuthStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const userId = urlParams.get('userId');
    
    if (status === 'success' && userId) {
      // Store userId and show dashboard
      currentUserId = userId;
      localStorage.setItem('veridaUserId', userId);
      showDashboard();
      
      // Clean URL
      window.history.replaceState({}, document.title, '/');
    } else {
      // Check localStorage for existing user
      const storedUserId = localStorage.getItem('veridaUserId');
      if (storedUserId) {
        currentUserId = storedUserId;
        showDashboard();
      }
    }
  }
  
  // Show dashboard after authentication
  function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
  }
  
  // Connect button handler
  connectBtn.addEventListener('click', async function() {
    try {
      connectBtn.disabled = true;
      connectBtn.textContent = 'Connecting...';
      
      const response = await fetch('/api/auth/url');
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        // Redirect to Verida auth
        window.location.href = data.authUrl;
      } else {
        alert('Failed to generate authentication URL');
        connectBtn.disabled = false;
        connectBtn.textContent = 'Connect with Verida';
      }
    } catch (error) {
      console.error('Error connecting to Verida:', error);
      alert('Error connecting to Verida');
      connectBtn.disabled = false;
      connectBtn.textContent = 'Connect with Verida';
    }
  });
  
  // Fetch groups button handler
  fetchGroupsBtn.addEventListener('click', async function() {
    if (!currentUserId) {
      alert('Not authenticated. Please connect to Verida first.');
      return;
    }
    
    try {
      fetchGroupsBtn.disabled = true;
      groupCount.textContent = '...';
      groupsJson.textContent = 'Loading...';
      
      const response = await fetch(`/api/telegram/groups?userId=${currentUserId}`);
      const data = await response.json();
      
      console.log('Groups API response:', data);
      
      if (data.success) {
        groupCount.textContent = data.count !== undefined ? data.count : (data.groups && data.groups.length) || 0;
        
        if (!data.groups || data.groups.length === 0) {
          groupsJson.textContent = 'No groups found. You may need to sync your Telegram data first.';
        } else {
          groupsJson.textContent = JSON.stringify(data.groups, null, 2);
        }
      } else {
        alert(`Error: ${data.error}`);
        groupsJson.textContent = `Error: ${data.error}`;
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      groupsJson.textContent = `Error: ${error.message}`;
    } finally {
      fetchGroupsBtn.disabled = false;
    }
  });
  
  // Fetch messages button handler
  fetchMessagesBtn.addEventListener('click', async function() {
    if (!currentUserId) {
      alert('Not authenticated. Please connect to Verida first.');
      return;
    }
    
    try {
      fetchMessagesBtn.disabled = true;
      messageCount.textContent = '...';
      messagesJson.textContent = 'Loading...';
      
      const response = await fetch(`/api/telegram/messages?userId=${currentUserId}`);
      const data = await response.json();
      
      console.log('Messages API response:', data);
      
      if (data.success) {
        messageCount.textContent = data.count !== undefined ? data.count : (data.messages && data.messages.length) || 0;
        
        if (!data.messages || data.messages.length === 0) {
          messagesJson.textContent = 'No messages found. You may need to sync your Telegram data first.';
        } else {
          messagesJson.textContent = JSON.stringify(data.messages, null, 2);
        }
      } else {
        alert(`Error: ${data.error}`);
        messagesJson.textContent = `Error: ${data.error}`;
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      messagesJson.textContent = `Error: ${error.message}`;
    } finally {
      fetchMessagesBtn.disabled = false;
    }
  });
  
  // Fetch stats button handler
  fetchStatsBtn.addEventListener('click', async function() {
    if (!currentUserId) {
      alert('Not authenticated. Please connect to Verida first.');
      return;
    }
    
    try {
      fetchStatsBtn.disabled = true;
      fetchStatsBtn.textContent = 'Loading...';
      
      // Reset counts to loading state
      [groupCount, messageCount, clusterCount, protocolCount, 
       aiCount, defiCount, cryptoCount, web3Count].forEach(el => {
        el.textContent = '...';
      });
      
      const response = await fetch(`/api/telegram/stats?userId=${currentUserId}`);
      const data = await response.json();
      
      console.log('Stats API response:', data);
      
      if (data.success) {
        const { stats } = data;
        
        // Make sure stats and its properties exist before accessing
        if (stats && stats.groups) {
          groupCount.textContent = stats.groups.count || 0;
        } else {
          groupCount.textContent = 0;
        }
        
        if (stats && stats.messages) {
          messageCount.textContent = stats.messages.count || 0;
          
          // Update keyword counts safely
          const keywordCounts = stats.messages.keywordCounts || {};
          clusterCount.textContent = keywordCounts.cluster || 0;
          protocolCount.textContent = keywordCounts.protocol || 0;
          aiCount.textContent = keywordCounts.ai || 0;
          defiCount.textContent = keywordCounts.defi || 0;
          cryptoCount.textContent = keywordCounts.crypto || 0;
          web3Count.textContent = keywordCounts.web3 || 0;
        } else {
          // Reset counts if no message data
          messageCount.textContent = 0;
          [clusterCount, protocolCount, aiCount, defiCount, cryptoCount, web3Count].forEach(el => {
            el.textContent = 0;
          });
        }
      } else {
        alert(`Error: ${data.error}`);
        // Reset all counts on error
        [groupCount, messageCount, clusterCount, protocolCount, 
         aiCount, defiCount, cryptoCount, web3Count].forEach(el => {
          el.textContent = 0;
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      alert(`Error: ${error.message}`);
    } finally {
      fetchStatsBtn.disabled = false;
      fetchStatsBtn.textContent = 'Fetch Keyword Stats';
    }
  });
  
  // Search button handler
  searchBtn.addEventListener('click', async function() {
    if (!currentUserId) {
      alert('Not authenticated. Please connect to Verida first.');
      return;
    }
    
    const keyword = searchInput.value.trim();
    if (!keyword) {
      alert('Please enter a keyword to search for.');
      return;
    }
    
    try {
      searchBtn.disabled = true;
      searchResultsContainer.classList.remove('hidden');
      searchResults.textContent = `Searching for "${keyword}"...`;
      searchCount.textContent = '...';
      
      const response = await fetch(`/api/telegram/search?userId=${currentUserId}&keyword=${encodeURIComponent(keyword)}`);
      const data = await response.json();
      
      console.log('Search API response:', data);
      
      if (data.success) {
        searchCount.textContent = data.count !== undefined ? data.count : (data.messages && data.messages.length) || 0;
        
        // If no results, show a message
        if (!data.messages || data.messages.length === 0) {
          searchResults.textContent = `No messages found containing "${keyword}". You may need to sync your Telegram data first.`;
        } else {
          searchResults.textContent = JSON.stringify(data.messages, null, 2);
        }
      } else {
        alert(`Error: ${data.error}`);
        searchResults.textContent = `Error: ${data.error}`;
      }
    } catch (error) {
      console.error('Error searching messages:', error);
      searchResults.textContent = `Error: ${error.message}`;
    } finally {
      searchBtn.disabled = false;
    }
  });
  
  // Enter key in search input triggers search
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchBtn.click();
    }
  });
  
  // Check auth status on page load
  checkAuthStatus();
}); 