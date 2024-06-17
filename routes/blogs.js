const express = require('express');
const routes = express.Router();
const Blog = require('../models/blogs');
const Review = require('../models/review');
const { isLoggedIn } = require('../middleware');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');

// Middleware setup
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Flash messages setup
app.use(session({
    secret: 'secret', // Replace with your secret
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Routes
app.use('/', routes);

// List all the blogs
routes.get('/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find({});
        res.render('blogs/index', { blogs });
    } catch (e) {
        console.log("Error finding blogs:", e);
        req.flash('error', 'Cannot Find Blogs');
        res.redirect('/error');
    }
});

// Getting a form for adding new blog
routes.get('/blogs/new', isLoggedIn, (req, res) => {
    res.render('blogs/new');
});

// Create a new blog
routes.post('/blogs', isLoggedIn, async (req, res) => {
    try {
        await Blog.create(req.body);
        req.flash('success', 'New Blog Added Successfully!');
        res.redirect('/blogs');
    } catch (e) {
        console.log("Error creating blog:", e);
        req.flash('error', 'Cannot Create Blog');
        res.redirect('/error');
    }
});

// Show particular blog
routes.get('/blogs/:id', async (req, res) => {
    try {
        const foundBlog = await Blog.findById(req.params.id).populate('reviews');
        if (!foundBlog) {
            req.flash('error', 'Blog not found');
            return res.redirect('/blogs');
        }
        res.render('blogs/show', { foundBlog });
    } catch (e) {
        console.log("Error finding blog:", e);
        req.flash('error', 'Cannot Find this Blog');
        res.redirect('/error');
    }
});

// Edit blog route
routes.get('/blogs/:id/edit', isLoggedIn, async (req, res) => {
    try {
        const foundBlog = await Blog.findById(req.params.id);
        if (!foundBlog) {
            req.flash('error', 'Blog not found');
            return res.redirect('/blogs');
        }
        res.render('blogs/edit', { foundBlog });
    } catch (e) {
        console.error("Error finding blog:", e);
        req.flash('error', 'Cannot Edit this Blog');
        res.redirect('/blogs');
    }
});

// Update blog route
routes.patch('/blogs/:id', isLoggedIn, async (req, res) => {
    try {
        const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedBlog) {
            req.flash('error', 'Blog not found');
            return res.redirect('/blogs');
        }
        req.flash('success', 'Updated Successfully!');
        res.redirect(`/blogs/${req.params.id}`);
    } catch (e) {
        console.error("Error updating blog:", e);
        req.flash('error', 'Cannot Update this Blog');
        res.redirect('/blogs');
    }
});

// Delete a particular blog
routes.delete('/blogs/:id', isLoggedIn, async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id);
        req.flash('success', 'Deleted the Blog Successfully');
        res.redirect('/blogs');
    } catch (e) {
        console.log("Error deleting blog:", e);
        req.flash('error', 'Cannot Delete this Blog');
        res.redirect('/error');
    }
});

// Creating a new review on a blog
routes.post('/blogs/:id/review', isLoggedIn, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        const review = new Review({
            user: req.user.username,
            ...req.body
        });
        blog.reviews.push(review);
        await review.save();
        await blog.save();
        req.flash('success', 'Successfully added your review!');
        res.redirect(`/blogs/${req.params.id}`);
    } catch (e) {
        console.log("Error adding review:", e);
        req.flash('error', 'Cannot Add Review to this Blog');
        res.redirect('/error');
    }
});

// Error page
routes.get('/error', (req, res) => {
    res.status(404).render('error');
});

module.exports = routes;
