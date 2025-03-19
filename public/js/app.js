// Global variables
let userId = null;
let autoRefreshInterval = null;
const REFRESH_INTERVAL = 30000; // 30 seconds

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Check URL parameters for userId on page load
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('userId')) {
        userId = urlParams.get('userId');
        // Store userId in sessionStorage
        sessionStorage.setItem('userId', userId);
        
        // Auto fetch data immediately
        fetchAllData();
        
        // Set up automatic refresh
        startAutoRefresh();
        
        // Update UI to show connected state
        updateConnectionStatus(true);
    } else if (sessionStorage.getItem('userId')) {
        // Retrieve from session if available
        userId = sessionStorage.getItem('userId');
        
        // Auto fetch data immediately
        fetchAllData();
        
        // Set up automatic refresh
        startAutoRefresh();
        
        // Update UI to show connected state
        updateConnectionStatus(true);
    } else {
        // Not logged in
        updateConnectionStatus(false);
    }
    
    // Set up connect button
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectToVerida);
    }
});

// Start auto-refresh
function startAutoRefresh() {
    // Clear any existing interval
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Set up new interval
    autoRefreshInterval = setInterval(() => {
        console.log('Auto-refreshing data...');
        fetchAllData();
    }, REFRESH_INTERVAL);
    
    // Add indicator to UI
    const statusElement = document.getElementById('refreshStatus');
    if (statusElement) {
        statusElement.textContent = `Auto-refreshing every ${REFRESH_INTERVAL/1000} seconds`;
    }
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        
        // Update UI
        const statusElement = document.getElementById('refreshStatus');
        if (statusElement) {
            statusElement.textContent = 'Auto-refresh stopped';
        }
    }
}

// Fetch all data types
function fetchAllData() {
    if (!userId) {
        console.error('Cannot fetch data: No userId available');
        return;
    }
    
    // Fetch all data types
    fetchGroups();
    fetchMessages();
    fetchStats();
    fetchCounts();
}

// Connect to Verida
async function connectToVerida() {
    try {
        const response = await fetch('/api/auth/url');
        const data = await response.json();
        
        if (data.success && data.authUrl) {
            // Redirect to Verida auth URL
            window.location.href = data.authUrl;
        } else {
            console.error('Failed to get auth URL');
            alert('Failed to connect to Verida. Please try again.');
        }
    } catch (error) {
        console.error('Error connecting to Verida:', error);
        alert('Error connecting to Verida. Please try again.');
    }
}

// Fetch Telegram groups
async function fetchGroups() {
    try {
        const response = await fetch(`/api/telegram/groups?userId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
            // Update UI with groups data
            updateGroupsUI(data.groups);
        } else {
            console.error('Failed to fetch groups:', data.error);
        }
    } catch (error) {
        console.error('Error fetching groups:', error);
    }
}

// Fetch Telegram messages
async function fetchMessages() {
    try {
        const response = await fetch(`/api/telegram/messages?userId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
            // Update UI with messages data
            updateMessagesUI(data.messages);
        } else {
            console.error('Failed to fetch messages:', data.error);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Fetch Telegram stats
async function fetchStats() {
    try {
        const response = await fetch(`/api/telegram/stats?userId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
            // Update UI with stats data
            updateStatsUI(data.stats);
        } else {
            console.error('Failed to fetch stats:', data.error);
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// Fetch Telegram counts
async function fetchCounts() {
    try {
        const response = await fetch(`/api/telegram/count?userId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
            // Update UI with count data
            updateCountsUI(data.counts);
        } else {
            console.error('Failed to fetch counts:', data.error);
        }
    } catch (error) {
        console.error('Error fetching counts:', error);
    }
}

// Update UI functions - implement these based on your actual UI structure
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    const connectBtn = document.getElementById('connectBtn');
    
    if (statusElement) {
        statusElement.textContent = isConnected ? 'Connected to Verida' : 'Not connected';
        statusElement.className = isConnected ? 'connected' : 'disconnected';
    }
    
    if (connectBtn) {
        connectBtn.style.display = isConnected ? 'none' : 'block';
    }
    
    // Show/hide data sections
    const dataSections = document.querySelectorAll('.data-section');
    dataSections.forEach(section => {
        section.style.display = isConnected ? 'block' : 'none';
    });
}

function updateGroupsUI(groups) {
    const groupsContainer = document.getElementById('groupsContainer');
    if (!groupsContainer) return;
    
    // Update groups count
    const countElement = document.getElementById('groupsCount');
    if (countElement) {
        countElement.textContent = groups.length;
    }
    
    // Clear existing content
    groupsContainer.innerHTML = '';
    
    // Add groups to UI
    groups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.className = 'group-item';
        groupElement.innerHTML = `
            <h3>${group.groupName || 'Unnamed Group'}</h3>
            <p>ID: ${group.groupId}</p>
        `;
        groupsContainer.appendChild(groupElement);
    });
}

function updateMessagesUI(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    // Update messages count
    const countElement = document.getElementById('messagesCount');
    if (countElement) {
        countElement.textContent = messages.length;
    }
    
    // Clear existing content
    messagesContainer.innerHTML = '';
    
    // Add messages to UI (limit to 50 most recent for performance)
    const recentMessages = messages.slice(0, 50);
    recentMessages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = 'message-item';
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${message.fromName || 'Unknown'}</span>
                <span class="message-date">${formatDate(message.date)}</span>
            </div>
            <div class="message-content">${message.messageText || ''}</div>
        `;
        messagesContainer.appendChild(messageElement);
    });
}

function updateStatsUI(stats) {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;
    
    // Update stats visualization
    statsContainer.innerHTML = `
        <div class="stat-item">
            <h3>Groups</h3>
            <p>${stats.groups.count}</p>
        </div>
        <div class="stat-item">
            <h3>Messages</h3>
            <p>${stats.messages.count}</p>
        </div>
        <div class="stat-item">
            <h3>Keywords</h3>
            <div id="keywordStats"></div>
        </div>
    `;
    
    // Add keyword stats
    const keywordStats = document.getElementById('keywordStats');
    if (keywordStats && stats.messages.keywordCounts) {
        Object.entries(stats.messages.keywordCounts).forEach(([keyword, count]) => {
            const keywordElement = document.createElement('div');
            keywordElement.className = 'keyword-stat';
            keywordElement.innerHTML = `
                <span class="keyword">${keyword}:</span>
                <span class="count">${count}</span>
            `;
            keywordStats.appendChild(keywordElement);
        });
    }
}

function updateCountsUI(counts) {
    const countsContainer = document.getElementById('countsContainer');
    if (!countsContainer) return;
    
    countsContainer.innerHTML = `
        <div class="count-item">
            <h3>Total Groups</h3>
            <p>${counts.groups}</p>
        </div>
        <div class="count-item">
            <h3>Total Messages</h3>
            <p>${counts.messages}</p>
        </div>
    `;
}

// Helper function to format dates
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
} 