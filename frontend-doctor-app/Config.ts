// TODO: Link this due to updates not using the right Env variables.
import * as Updates from 'expo-updates';

let Config = {
    // development, preview
    // apiUrl: "https://amazed-mink-trivially.ngrok-free.app",
    apiUrl: "https://pinnacle-api.geddit-apps.com",
    supabaseUrl: 'https://ksminnjzhpczzmtoztgt.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbWlubmp6aHBjenptdG96dGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc1MDY0MjQsImV4cCI6MjAzMzA4MjQyNH0.xaNQViFAqXpK87twd2to1iEmKiWvYxk91o5GOSUd2XA'
};

if (Updates.channel === 'production') {
    Config.apiUrl = "https://pinnaclesg-api.pinnaclefamilyclinic.com.sg";
    Config.supabaseUrl = 'https://yaadelemrtuxfyxayxpu.supabase.co';
    Config.supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhYWRlbGVtcnR1eGZ5eGF5eHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM2MTc5NDcsImV4cCI6MjAzOTE5Mzk0N30.gO_D1CzL_dBoJgVPdNk0OAvI1mIyn-HP2HereNIA6jw';
};

export const apiUrl = Config.apiUrl;
export const supabaseUrl = Config.supabaseUrl;
export const supabaseAnonKey = Config.supabaseAnonKey;
export const DOMAIN = apiUrl + '/api/doctor';
