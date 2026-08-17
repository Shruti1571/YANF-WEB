const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Blog = require('../models/Blog');

// Middleware to verify Admin JWT Token
function authAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'yanf_secret_jwt_key_2026';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

// GET /api/blogs — Public list of published blogs (or all for admin)
router.get('/', async (req, res) => {
  try {
    const { category, search, all } = req.query;
    const filter = {};

    if (all !== 'true') {
      filter.status = 'published';
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.error('Fetch blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs.' });
  }
});

// GET /api/blogs/:slug — Public single blog details
router.get('/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }
    res.json(blog);
  } catch (error) {
    console.error('Fetch single blog error:', error);
    res.status(500).json({ error: 'Failed to fetch blog post.' });
  }
});

// POST /api/blogs — Create new blog post (Protected Admin)
router.post('/', authAdmin, async (req, res) => {
  try {
    const {
      title,
      slug,
      metaTitle,
      metaDescription,
      metaKeywords,
      category,
      author,
      readTime,
      summary,
      content,
      coverImage,
      status
    } = req.body;

    if (!title || !summary || !content) {
      return res.status(400).json({ error: 'Title, summary, and content are required.' });
    }

    const generatedSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existingBlog = await Blog.findOne({ slug: generatedSlug });
    if (existingBlog) {
      return res.status(400).json({ error: 'A blog post with this slug or title already exists.' });
    }

    const newBlog = new Blog({
      title,
      slug: generatedSlug,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || summary,
      metaKeywords,
      category: category || 'Diplomacy',
      author: author || 'YANF Editorial',
      readTime: readTime || '4 min read',
      summary,
      content,
      coverImage,
      status: status || 'published'
    });

    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ error: 'Failed to create blog post.' });
  }
});

// PUT /api/blogs/:id — Update existing blog post (Protected Admin)
router.put('/:id', authAdmin, async (req, res) => {
  try {
    const {
      title,
      slug,
      metaTitle,
      metaDescription,
      metaKeywords,
      category,
      author,
      readTime,
      summary,
      content,
      coverImage,
      status
    } = req.body;

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }

    if (slug !== undefined) {
      const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      if (sanitizedSlug && sanitizedSlug !== blog.slug) {
        // Check uniqueness across other blog posts
        const duplicate = await Blog.findOne({ slug: sanitizedSlug, _id: { $ne: blog._id } });
        if (duplicate) {
          return res.status(400).json({ error: `The permalink slug '${sanitizedSlug}' is already in use by another article.` });
        }
        blog.slug = sanitizedSlug;
      }
    }

    if (title !== undefined) blog.title = title;
    if (metaTitle !== undefined) blog.metaTitle = metaTitle;
    if (metaDescription !== undefined) blog.metaDescription = metaDescription;
    if (metaKeywords !== undefined) blog.metaKeywords = metaKeywords;
    if (category !== undefined) blog.category = category;
    if (author !== undefined) blog.author = author;
    if (readTime !== undefined) blog.readTime = readTime;
    if (summary !== undefined) blog.summary = summary;
    if (content !== undefined) blog.content = content;
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (status !== undefined) blog.status = status;
    blog.updatedAt = new Date();

    await blog.save();
    res.json(blog);
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: error.message || 'Failed to update blog post.' });
  }
});

// DELETE /api/blogs/:id — Delete blog post (Protected Admin)
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Permission denied. Deletion is restricted strictly to Super Admin.' });
    }

    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }
    res.json({ message: 'Blog post deleted successfully.' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Failed to delete blog post.' });
  }
});

module.exports = router;
