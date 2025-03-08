const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

app.get('/auth/callback', (req, res) => {
  try {
    console.log('Auth callback received with data:', req.query);
    
    // Verida should send the token as a JSON string in the request
    // Either directly in the body or as a query parameter
    const rawToken = req.query.token || req.body.token;
    
    if (!rawToken) {
      // If no token, this might be the initial redirect - redirect to Verida's token generator
      // with our frontend as the callback
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const returnUrl = `${frontendUrl}?source=verida_callback`;
      
      console.log('No token found, redirecting to Verida token generator with return URL:', returnUrl);
      
      // Use the Verida token generator and set our frontend as the callback
      const tokenGeneratorUrl = `https://app.verida.ai/auth?scopes=api%3Ads-query&scopes=api%3Asearch-universal&scopes=ds%3Asocial-email&scopes=api%3Asearch-ds&scopes=api%3Asearch-chat-threads&scopes=ds%3Ar%3Asocial-chat-group&scopes=ds%3Ar%3Asocial-chat-message&redirectUrl=${encodeURIComponent(returnUrl)}&appDID=did%3Avda%3Amainnet%3A0x87AE6A302aBf187298FC1Fa02A48cFD9EAd2818D`;
      
      return res.redirect(tokenGeneratorUrl);
    }
    
    // If we have a token, parse it and extract the necessary information
    let token;
    try {
      token = typeof rawToken === 'string' ? JSON.parse(rawToken) : rawToken;
    } catch (error) {
      console.error('Error parsing token:', error);
      return res.status(400).send('Invalid token format');
    }
    
    console.log('Parsed token:', token);
    
    // Extract token information
    let did, authToken;
    
    // Handle different token formats
    if (token.token) {
      // Format: { token: { did: '...', _id: '...' } }
      did = token.token.did;
      authToken = token.token._id;
    } else if (token.did && token._id) {
      // Format: { did: '...', _id: '...' }
      did = token.did;
      authToken = token._id;
    } else {
      console.error('Token is missing required fields:', token);
      return res.status(400).send('Token is missing required fields');
    }
    
    if (!did || !authToken) {
      console.error('Missing DID or authToken in token:', token);
      return res.status(400).send('Missing DID or authToken in token');
    }
    
    // Redirect to frontend with the extracted token information
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}?did=${encodeURIComponent(did)}&authToken=${encodeURIComponent(authToken)}&token=${encodeURIComponent(JSON.stringify(token))}`;
    
    console.log('Redirecting to frontend with token data:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in auth callback:', error);
    res.status(500).send('Error processing authentication callback');
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('FOMOscore API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});