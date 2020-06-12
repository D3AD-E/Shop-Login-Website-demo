const express = require('express');
const router = new express.Router();

// Welcome Page
router.get('/', (req, res) => res.render('welcome'));

module.exports = router;