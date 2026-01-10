// Runtime configuration
window.ENV = {
  API_URL: window.location.hostname === 'localhost' 
    ? '/api' 
    : 'https://inventory-backend-81oh.onrender.com/api'
};
