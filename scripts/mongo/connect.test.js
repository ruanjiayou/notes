const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/test?readPreference=primaryPreferred');
const model = mongoose.model('test', new mongoose.Schema({}, { strict: false }));
(async()=>{
    let n = await model.find().count();
    console.log(n);
})