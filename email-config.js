// Email Configuration
// Replace these with your actual Gmail credentials

module.exports = {
  // Gmail SMTP Configuration
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // Replace with your Gmail address
    pass: 'your-app-password' // Replace with your Gmail App Password (not regular password)
  },
  
  // Email settings
  from: 'your-email@gmail.com', // Should match the user above
  
  // Instructions for setup:
  // 1. Go to your Google Account settings
  // 2. Enable 2-Factor Authentication
  // 3. Generate an "App Password" for this application
  // 4. Use the App Password (not your regular Gmail password) in the 'pass' field above
  // 5. Update the 'user' and 'from' fields with your Gmail address
};



