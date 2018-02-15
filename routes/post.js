var express = require('express');
var router = require('express').Router();
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');

var Post = require('../models/post');
var Article = require('../models/article');
var Category = require('../models/category');

router.get('/posts', function (req, res) {
    
    Post.find(function (err, posts, articles) {
        if (err)
            console.log(err);
        
        res.render('main/posts', {
            title: 'All Posts',
            posts: posts
        });
    });   
    
});

router.get('/add-post', function (req, res, next) {

    var title = "";
    var desc = "";

    Category.find(function (err, categories) {
        res.render('admin/add-posts', {
            title: title,
            desc: desc,
            categories: categories
        });
    });
});

router.post('/add-post', function (req, res, next) {

    var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";

    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('desc', 'Description must have a value.').notEmpty();
    req.checkBody('image', 'Please upload an image').isImage(imageFile);

    var title = req.body.title;
    // var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var message = req.body.message;
    var category = req.body.category;

    var errors = req.validationErrors();

    if (errors) {
        Category.find(function (err, categories) {
            res.render('admin/add-posts', {
                errors: errors,
                title: title,
                desc: desc,
                categories: categories,
            });
        });
    } else {
        Post.findOne({title: title}, function (err, post) {
            if (post) {
                req.flash('danger', 'Title exists, choose another.');
                Category.find(function (err, categories) {
                    res.render('admin/add-posts', {
                        title: title,
                        desc: desc,
                        categories: categories,
                    });
                });
            } else {

                var post = new Post({
                    title: title,
                   // slug: slug,
                    desc: desc,
                    message: message,
                    category: category,
                    image: imageFile
                });

                post.save(function (err) {
                    if (err)
                        return console.log(err);

                    mkdirp('public/post_images/' + post._id, function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/post_images/' + post._id + '/gallery', function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/post_images/' + post._id + '/gallery/thumbs', function (err) {
                        return console.log(err);
                    });

                    if (imageFile != "") {
                        var postImage = req.files.image;
                        var path = 'public/post_images/' + post._id + '/' + imageFile;

                        postImage.mv(path, function (err) {
                            return console.log(err);
                        });
                    }

                    req.flash('success', 'Post added!');
                    res.redirect('add-post');
                });
            }
        });
    }

});

router.get('/edit-post/:id', function (req, res) {

    var errors;

    if (req.session.errors)
        errors = req.session.errors;
    req.session.errors = null;

    Category.find(function (err, categories) {

        Post.findById(req.params.id, function (err, p) {
            if (err) {
                console.log(err);
                res.redirect('/admin/posts');
            } else {
                var galleryDir = 'public/post_images/' + p._id + '/gallery';
                var galleryImages = null;

                fs.readdir(galleryDir, function (err, files) {
                    if (err) {
                        console.log(err);
                    } else {
                        galleryImages = files;

                        res.render('admin/edit_post', {
                            title: p.title,
                            errors: errors,
                            desc: p.desc,
                            categories: categories,
                            category: p.category.replace(/\s+/g, '-').toLowerCase(),
                            image: p.image,
                            galleryImages: galleryImages,
                            id: p._id
                        });
                    }
                });
            }
        });

    });

});

/*
 * POST edit product
 */
router.post('/edit-post/:id', function (req, res) {

    var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";

    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('desc', 'Description must have a value.').notEmpty();
    req.checkBody('price', 'Price must have a value.').isDecimal();
    req.checkBody('image', 'You must upload an image').isImage(imageFile);

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;
    var pimage = req.body.pimage;
    var id = req.params.id;

    var errors = req.validationErrors();

    if (errors) {
        req.session.errors = errors;
        res.redirect('/admin/products/edit-product/' + id);
    } else {
        Product.findOne({slug: slug, _id: {'$ne': id}}, function (err, p) {
            if (err)
                console.log(err);

            if (p) {
                req.flash('danger', 'Product title exists, choose another.');
                res.redirect('/admin/products/edit-product/' + id);
            } else {
                Product.findById(id, function (err, p) {
                    if (err)
                        console.log(err);

                    p.title = title;
                    p.slug = slug;
                    p.desc = desc;
                    p.price = parseFloat(price).toFixed(2);
                    p.category = category;
                    if (imageFile != "") {
                        p.image = imageFile;
                    }

                    p.save(function (err) {
                        if (err)
                            console.log(err);

                        if (imageFile != "") {
                            if (pimage != "") {
                                fs.remove('public/product_images/' + id + '/' + pimage, function (err) {
                                    if (err)
                                        console.log(err);
                                });
                            }

                            var productImage = req.files.image;
                            var path = 'public/product_images/' + id + '/' + imageFile;

                            productImage.mv(path, function (err) {
                                return console.log(err);
                            });

                        }

                        req.flash('success', 'Product edited!');
                        res.redirect('/admin/products/edit-product/' + id);
                    });

                });
            }
        });
    }

});

module.exports = router;
