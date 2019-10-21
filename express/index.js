const express = require('express');
const app = express();

app.use(express.static('../../web-password/build'));
app.get('/root/*', function (req, res, next) {
    res.redirect('/');
});

app.listen(3333, function () {
    console.log('static: 3333')
})