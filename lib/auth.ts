// For Vercel deployment, we'll handle Google Cloud authentication using environment variables
// This file provides the service account configuration for Google Vertex AI

export function getGoogleCredentials() {
  // In production (Vercel), the service account should be stored as an environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      return JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    } catch (error) {
      console.error('Error parsing Google credentials:', error);
      return null;
    }
  }
  
  // In development, you can use the service account file directly
  if (process.env.NODE_ENV === 'development') {
    try {
      return require('../service-account.json');
    } catch (error) {
      console.warn('Service account file not found in development');
      return null;
    }
  }
  
  return null;
}