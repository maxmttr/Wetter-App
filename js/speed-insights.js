/**
 * Vercel Speed Insights Integration
 * This file initializes Vercel Speed Insights for tracking web vitals
 */
import { injectSpeedInsights } from '../node_modules/@vercel/speed-insights/dist/index.mjs';

// Initialize Speed Insights
injectSpeedInsights({
  debug: false, // Set to true to enable debug logging in development
  // Additional configuration can be added here as needed:
  // sampleRate: 1, // Sample rate (0-1), defaults to 1 (100% of events)
  // beforeSend: (event) => event, // Middleware to modify events before sending
});
