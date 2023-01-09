const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');
const readline = require('readline');
const OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/upload_app_session.json
const SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
];

const TOKEN_PATH = path.join(__dirname, '../store/upload_app_session.json');

const authorize = (credentials, cb) => {
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (error, token) => {
        if (error) {
            return getNewToken(oauth2Client, cb);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            return cb(null, oauth2Client);
        }
    });
};

const getNewToken = (oauth2Client, cb) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', code => {
        rl.close();
        oauth2Client.getToken(code, (error, token) => {
            if (error) {
                return cb(
                    new Error(
                        'Error while trying to retrieve access token',
                        error
                    )
                );
            }
            oauth2Client.credentials = token;
            storeToken(token);
            return cb(null, oauth2Client);
        });
    });
};

const storeToken = token => {
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), error => {
        if (error) throw error;
        console.log('Token stored to ' + TOKEN_PATH);
    });
};

module.exports = { authorize };

// const { google } = require('googleapis');

// const oauth2Client = new google.auth.OAuth2({
//   clientId: '',
//   clientSecret: '',
//   redirectUri: '',
// });

// module.exports = oauth2Client;