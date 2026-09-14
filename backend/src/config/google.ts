import { google } from 'googleapis';
import path from 'path';

// Define the scopes required for calendar manipulation
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

// Path to the downloaded credentials.json
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

// Initialize the JWT auth client
const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: SCOPES,
});

export const calendar = google.calendar({ version: 'v3', auth });

// Master calendar ID (the one shared with the service account)
// For testing, we can use 'primary' if we want to use the service account's own calendar,
// but usually we want to pass the specific calendar ID that the user shared.
export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
