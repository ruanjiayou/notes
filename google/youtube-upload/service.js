const path = require('path');
const { google } = require('googleapis');
const service = google.youtube('v3');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'store/my-project-1498612385758-88f9b70d2adf.json'),
  scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
});

// 获取我的播放列表
service.playlists.list({
  auth,
  channelId: 'UCGBnAQr295FeTE-9e11nMNA',
  part: [],
}).then(resp => {
  console.log(resp.data)
})

service.videos.

// var google = require('googleapis');
// var ResumableUpload = require('node-youtube-resumable-upload');
// var authClient = new google.auth.JWT(
//   'Service account client email address', #You will get "Email address" in developer console for Service Account:
//     'youtube.pem',
//       null,
//       ['https://www.googleapis.com/auth/youtube', 'https://www.googleapis.com/auth/youtube.upload'],
//       null
// );
// authClient.authorize(function (err, tokens) {
//   if (err) {
//     console.log(err);
//     return;
//   }
//   var metadata = { snippet: { title: 'title', description: 'Uploaded with ResumableUpload' }, status: { privacyStatus: 'private' } };
//   var resumableUpload = new ResumableUpload(); //create new ResumableUpload
//   resumableUpload.tokens = tokens;
//   resumableUpload.filepath = 'youtube.3gp';
//   resumableUpload.metadata = metadata;
//   resumableUpload.monitor = true;
//   resumableUpload.eventEmitter.on('progress', function (progress) {
//     console.log(progress);
//   });
//   resumableUpload.initUpload(function (result) {
//     console.log(result);
//     return;
//   });

// });