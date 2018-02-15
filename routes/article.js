var express = require('express');
var router = require('express').Router();
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');

var Article = require('../models/article');
var Category = require('../models/category');


router.get('/articles', function (req, res) {
    var count;

    Article.count(function (err, c) {
        count = c;
    });
    Article.find(function (err, c) {
        res.render('admin/articles', {
            articles: Article,
            count: count
        });
    });
});

router.get('/add-article', function (req, res, next) {

    var title = "";
    var desc = "";
    var price = "";

    Category.find(function (err, categories) {
        res.render('admin/add-article', {
            title: title,
            desc: desc,
            categories: categories,
            price: price
        });
    });


});

router.post('/add-article', function (req, res, next) {

    var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";

    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('desc', 'Description must have a value.').notEmpty();
    req.checkBody('image', 'Please upload an image').isImage(imageFile);

    var title = req.body.title;
    // var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var message = req.body.message;
    var category = req.body.category;

    var errors = req.validationErrors();

    if (errors) {
        Category.find(function (err, categories) {
            res.render('admin/add-article', {
                errors: errors,
                title: title,
                message: message,
                desc: desc,
                categories: categories,
                price: price
            });
        });
    } else {
        Article.findOne({title: title}, function (err, article) {
            if (article) {
                req.flash('danger', 'Title exists, choose another.');
                Category.find(function (err, categories) {
                    res.render('admin/add-article', {
                        title: title,
                        desc: desc,
                        categories: categories,
                        price: price
                    });
                });
            } else {
                var price2 = parseFloat(price).toFixed(2);
                
                var article = new Article({
                    title: title,
                   // slug: slug,
                    desc: desc,
                    price: price2,
                    message: message,
                    category: category,
                    image: imageFile
                });

                article.save(function (err) {
                    if (err)
                        return console.log(err);

                    mkdirp('public/article_images/' + article._id, function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/article_images/' + article._id + '/gallery', function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/article_images/' + article._id + '/gallery/thumbs', function (err) {
                        return console.log(err);
                    });

                    if (imageFile != "") {
                        var articleImage = req.files.image;
                        var path = 'public/article_images/' + article._id + '/' + imageFile;

                        articleImage.mv(path, function (err) {
                            return console.log(err);
                        });
                    }

                    req.flash('success', 'Article added!');
                    res.redirect('add-article');
                });
            }
        });
    }

});

module.exports = router;
