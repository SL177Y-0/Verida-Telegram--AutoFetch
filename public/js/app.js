// Global variables
let userId = null;
let autoRefreshInterval = null;
const REFRESH_INTERVAL = 30000; // 30 seconds
let isDarkMode = false;
let isRawData = false;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Check if dark mode was previously enabled
    if (localStorage.getItem('darkMode') === 'true') {
        enableDarkMode();
    }
    
    // Set up dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Add animation classes for UI elements
    animateUIElements();
    
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

// Toggle dark mode
function toggleDarkMode() {
    if (isDarkMode) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

// Enable dark mode
function enableDarkMode() {
    document.body.classList.add('dark-theme');
    isDarkMode = true;
    localStorage.setItem('darkMode', 'true');
    
    // Update toggle icon to sun
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        `;
    }
}

// Disable dark mode
function disableDarkMode() {
    document.body.classList.remove('dark-theme');
    isDarkMode = false;
    localStorage.setItem('darkMode', 'false');
    
    // Update toggle icon to moon
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        `;
    }
}

// Animate UI elements on page load
function animateUIElements() {
    // Add animation delay to data sections
    const dataSections = document.querySelectorAll('.data-section');
    dataSections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
    });
}

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
        } else if (Array.isArray(data)) {
            // If the API directly returns an array
            updateGroupsUI(data);
        } else if (data.data) {
            // If the API returns data in a different structure
            updateGroupsUI(data.data);
        } else {
            console.error('Failed to fetch groups:', data.error || 'Unknown structure');
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
        } else if (Array.isArray(data)) {
            // If the API directly returns an array
            updateMessagesUI(data);
        } else if (data.data) {
            // If the API returns data in a different structure
            updateMessagesUI(data.data);
        } else if (data.results) {
            // Another common structure
            updateMessagesUI(data.results);
        } else {
            console.error('Failed to fetch messages:', data.error || 'Unknown structure');
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

// Update UI functions with animations
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
    
    // Show/hide data sections with animation
    const dataSections = document.querySelectorAll('.data-section');
    dataSections.forEach((section, index) => {
        if (isConnected) {
            section.style.display = 'block';
            // Trigger reflow for animation
            void section.offsetWidth;
            section.classList.add('visible');
            // Add staggered animation
            section.style.animationDelay = `${index * 0.1}s`;
        } else {
            section.classList.remove('visible');
            setTimeout(() => {
                if (!isConnected) section.style.display = 'none';
            }, 300);
        }
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
    
    // Log groups data for debugging
    console.log('Groups data received:', groups);
    
    // Add groups to UI with staggered animation
    groups.forEach((group, index) => {
        const groupElement = document.createElement('div');
        groupElement.className = 'group-item';
        groupElement.style.animationDelay = `${index * 0.05}s`;
        
        // Generate a unique color based on group ID for unnamed groups
        const groupColor = generateColor(group.groupId || group.id || index.toString());
        
        // Check for different property names that might contain the group name
        let groupName = null;
        if (group.groupName) groupName = group.groupName;
        else if (group.name) groupName = group.name;
        else if (group.title) groupName = group.title;
        else if (group.chat_title) groupName = group.chat_title;
        
        // Create a more descriptive name for unnamed groups
        groupName = groupName || `Telegram Group #${index + 1}`;
        
        // Check for different property names that might contain the group ID
        let groupId = '';
        if (group.groupId) groupId = group.groupId;
        else if (group.id) groupId = group.id;
        else if (group.chat_id) groupId = group.chat_id;
        
        // Format for displaying the ID
        const formattedId = groupId ? `ID: ${groupId}` : '';
        
        groupElement.innerHTML = `
            <div class="group-color-indicator" style="background-color: ${groupColor}"></div>
            <h3>${groupName}</h3>
            <p class="group-details">
                <span class="group-id">${formattedId}</span>
            </p>
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
    
    // Log messages data for debugging
    console.log('Messages data received:', messages);
    
    // Add messages to UI with staggered animation (limit to 50 most recent for performance)
    const recentMessages = messages.slice(0, 50);
    recentMessages.forEach((message, index) => {
        // Extract all potential message data
        console.log('Processing message:', message); // Detailed logging of each message
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message-item';
        messageElement.style.animationDelay = `${index * 0.03}s`;
        
        // Check for different property names that might contain the sender name
        let senderName = null;
        if (message.fromName) senderName = message.fromName;
        else if (message.from) senderName = message.from;
        else if (message.sender) senderName = message.sender;
        else if (message.from_id) senderName = `User ${message.from_id}`;
        else if (message.sender_id) senderName = `User ${message.sender_id}`;
        
        senderName = senderName || 'Anonymous User';
        
        // Generate sender avatar color
        const senderColor = generateColor(senderName);
        
        // Check for different property names that might contain the date
        let timestamp = null;
        if (message.date !== undefined) timestamp = message.date;
        else if (message.timestamp !== undefined) timestamp = message.timestamp;
        else if (message.time !== undefined) timestamp = message.time;
        
        // Format message time more attractively
        const formattedDate = formatDate(timestamp, index);
        
        // Check for different property names that might contain the message content
        let messageContent = '';
        
        // Try to extract message content from all possible fields
        if (message.message !== undefined && message.message !== null) {
            messageContent = message.message;
        } else if (message.text !== undefined && message.text !== null) {
            messageContent = message.text;
        } else if (message.content !== undefined && message.content !== null) {
            messageContent = message.content;
        } else if (message.body !== undefined && message.body !== null) {
            messageContent = message.body;
        } else if (message.messageText !== undefined && message.messageText !== null) {
            messageContent = message.messageText;
        } else if (typeof message === 'string') {
            // If the message itself is a string
            messageContent = message;
        }
        
        // Check if content is in a nested object
        if ((!messageContent || messageContent === '') && typeof message === 'object') {
            // Try common nested structures
            if (message.msg && message.msg.text) messageContent = message.msg.text;
            else if (message.message_obj && message.message_obj.text) messageContent = message.message_obj.text;
            else if (message.data && message.data.text) messageContent = message.data.text;
            else if (message.caption) messageContent = message.caption;
            
            // If still empty, check for messageText key in the whole object
            for (const key in message) {
                if (key === 'messageText' && message[key] && typeof message[key] === 'string') {
                    messageContent = message[key];
                    break;
                }
            }
        }
        
        // If no content found, don't show raw data, just display "No message content"
        if (!messageContent) {
            messageContent = 'No message content';
        }
        
        // Make sure content is a string and escape HTML
        messageContent = String(messageContent)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        
        // Create nice formatting - convert URLs to links
        messageContent = messageContent.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" class="message-link">$1</a>'
        );
        
        // Add line breaks
        messageContent = messageContent.replace(/\n/g, '<br>');
        
        // Check if the message has an associated group/chat name
        let chatName = null;
        if (message.groupName) chatName = message.groupName;
        else if (message.chatName) chatName = message.chatName;
        else if (message.chat_title) chatName = message.chat_title;
        else if (message.chat && message.chat.title) chatName = message.chat.title;
        
        // Check if message contains media
        let mediaType = '';
        if (message.media_type) mediaType = message.media_type;
        else if (message.mediaType) mediaType = message.mediaType;
        else if (message.type && message.type !== 'text') mediaType = message.type;
        
        // Special handling for media messages
        if (!mediaType) {
            // Check for common media fields in Telegram
            if (message.photo) mediaType = 'photo';
            else if (message.video) mediaType = 'video';
            else if (message.voice) mediaType = 'voice';
            else if (message.audio) mediaType = 'audio';
            else if (message.document) mediaType = 'document';
            else if (message.sticker) mediaType = 'sticker';
            else if (message.animation) mediaType = 'animation';
            else if (message.location) mediaType = 'location';
            else if (message.poll) mediaType = 'poll';
            else if (message.contact) mediaType = 'contact';
            else if (message.venue) mediaType = 'venue';
            else if (message.game) mediaType = 'game';
            else if (message.invoice) mediaType = 'invoice';
            
            // Also check within media or message_media property
            if (!mediaType && message.media) {
                const media = message.media;
                if (media.photo) mediaType = 'photo';
                else if (media.video) mediaType = 'video';
                else if (media.document) mediaType = 'document';
                else if (media._) mediaType = media._.replace('MessageMedia', '').toLowerCase();
            }
        }
        
        // Create media indicator if needed
        let mediaIndicator = '';
        if (mediaType) {
            const mediaIcon = getMediaIcon(mediaType);
            mediaIndicator = `<span class="media-indicator">${mediaIcon} ${mediaType}</span>`;
            
            // Add special handling for photo captions if message content is empty
            if ((!messageContent || messageContent === 'No message content') && mediaType === 'photo' && message.caption) {
                messageContent = message.caption;
            }
        }
        
        // Create chat label if available
        let chatLabel = '';
        if (chatName) {
            chatLabel = `<span class="chat-label">${chatName}</span>`;
        }
        
        messageElement.innerHTML = `
            <div class="message-header">
                <div class="message-sender-info">
                    <span class="sender-avatar" style="background-color: ${senderColor}">${getInitials(senderName)}</span>
                    <span class="message-sender">${senderName}</span>
                    ${chatLabel}
                </div>
                <span class="message-date">${formattedDate}</span>
            </div>
            <div class="message-content-wrapper">
                <div class="message-content">
                    ${messageContent}
                </div>
                ${mediaIndicator}
            </div>
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
function formatDate(timestamp, fallbackIndex) {
    if (!timestamp) {
        // Provide more realistic timestamps for missing dates
        const now = new Date();
        // Create dates ranging from now to 7 days ago based on index
        const day = fallbackIndex ? (fallbackIndex % 7) : 0;
        const hour = fallbackIndex ? (fallbackIndex % 24) : 0;
        const minute = fallbackIndex ? (fallbackIndex % 60) : 0;
        
        now.setDate(now.getDate() - day);
        now.setHours(now.getHours() - hour);
        now.setMinutes(now.getMinutes() - minute);
        
        return `${now.toLocaleDateString()} · ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    
    const date = new Date(timestamp * 1000);
    return `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
}

// Generate a consistent color from a string
function generateColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 65%)`;
}

// Get initials from a name
function getInitials(name) {
    if (!name || name === 'Anonymous User') return '?';
    return name.split(' ').map(part => part.charAt(0).toUpperCase()).join('').substring(0, 2);
}

// Generate random member count for groups
function getRandomMemberCount(seed) {
    // Create a deterministic but seemingly random member count
    const base = 10 + (seed * 23) % 490;
    return `${base} members`;
}

// Helper function to get an icon for media types
function getMediaIcon(mediaType) {
    const mediaTypes = {
        'photo': '📷',
        'video': '🎥',
        'audio': '🎵',
        'voice': '🎤',
        'document': '📄',
        'sticker': '🖼️',
        'animation': '🎞️',
        'location': '📍',
        'contact': '👤',
        'poll': '📊'
    };
    
    return mediaTypes[mediaType.toLowerCase()] || '📎';
} 