const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const TagModel = require('../models/Tag'); // Adjust the path accordingly


const router = express();




// Middleware
router.use(express.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use(methodOverride('_method'));
router.set('view engine', 'ejs');

// Mongo URI
const mongoURI = 'mongodb://localhost:27017/user';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Get all files
router.get('/files', (req, res) => {
  console.log("get files");
  gfs.files.find().toArray((err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error retrieving files' });
    }
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }
    // Files exist
    return res.json(files);
  });
});



router.get('/image/:filename', (req, res) => {
  console.log("get image");
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});



router.get('/newtags',(req,res)=>res.render("newtag"));
router.get('/login', (req, res) => res.render("login"));
router.get('/register', (req, res) => res.render("register"));

module.exports = router;
