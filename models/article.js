var mongoose = require('mongoose');
// var mongoosastic = require('mongoosastic');
var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
    category: {type: Schema.Types.ObjectId, ref: 'Category'},
    title: String,
    image: String,
    desc: String,
    price: Number,
    message: String,
    created: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Article', ArticleSchema);