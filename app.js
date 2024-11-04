const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const UserModel = require('./models/User'); // Adjust the path accordingly
const TagModel = require('./models/Tag'); // Adjust the path accordingly

const app = express();



// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

app.get('/users/newtags', async (req, res) => {
  try {
      const tags = await TagModel.find(); 
      console.log(tags);
      console.log("here");
      res.render('newtag', { tags }); // Render the 'tags' view and pass the tags array
  } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
  }
});

// app.get('/users/upload', async (req, res) => {
//   try {
//       const tags = await TagModel.find(); 
//       console.log(tags);
//       console.log("here");
//       res.render('upload', { tags }); // Render the 'tags' view and pass the tags array
//   } catch (error) {
//       console.error(error);
//       res.status(500).send("Server Error");
//   }
// });


app.use('/users', require('./routes/users'));

// Upload page
app.get('/users/upload', (req, res) => {
  console.log("checking files");
  gfs.files.find().toArray(async(err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error retrieving files' });
    }
    // Check if files
    if (!files || files.length === 0) {
      return res.render('upload', { files: false }); // No leading slash
    } else {
        console.log("there are files here");
      files.map(file => {
        file.isImage = (file.contentType === 'image/jpeg' || file.contentType === 'image/png');
      });
      try {
        const tags = await TagModel.find(); 
        console.log(tags);
        console.log("here");
        return res.render('upload', { files: files ,tags: tags}); // No leading slash
    } catch (error) {
        console.log("nope we have an error");
        console.error(error);
        res.status(500).send("Server Error");
    }
      
    }
  });
});

app.get('/users/filesearch', (req, res) => {
  console.log("checking files");
  gfs.files.find().toArray(async(err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error retrieving files' });
    }
    // Check if files
    if (!files || files.length === 0) {
      return res.render('filesearch', { files: false, tags: []}); // No leading slash
    } else {
        console.log("there are files here");
      files.map(file => {
        file.isImage = (file.contentType === 'image/jpeg' || file.contentType === 'image/png');
      });
      try {
        const tags = await TagModel.find(); 
        console.log(tags);
        console.log("here");
        return res.render('filesearch', { files: files ,tags: tags}); // No leading slash
    } catch (error) {
        console.log("nope we have an error");
        console.error(error);
        res.status(500).send("Server Error");
    }
      
    }
  });
});


// Mongo URI
const mongoURI = 'mongodb://localhost:27017/user';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);
mongoose.connect('mongodb://localhost:27017/user', { useNewUrlParser: true, useUnifiedTopology: true });

// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    console.log("app js storage");
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads',
          metadata:{
            originalname: file.originalname
          }
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

app.get('/users', (req, res) => {
  console.log("hi there")
});

// @route POST /users/upload
// @desc  Uploads file to DB
app.post('/upload', upload.single('file'), (req, res) => {
  console.log('hi')
  res.redirect('/users/upload'); // Redirect to the upload page after upload
});

// Update the POST route for uploading files
app.post('/users/upload', upload.single('file'), (req, res) => {
  console.log("Upload initiated...");
  if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ error: 'No file uploaded' });
  }
  console.log("File uploaded:", req.file);
  res.json({ file: req.file });
});


app.post('/addTags/:id', (req, res) => {
  console.log("add tags");
  console.log("start req");

  console.log(req);
  console.log("start res");
  console.log(res);
  const fileId = req.params.id;
  const selectedTags = Array.isArray(req.body.tags) ? req.body.tags : [];
  if(!Array.isArray(req.body.tags)){
    selectedTags.push(req.body.tags);
  }
  console.log(fileId);
  console.log(selectedTags);
  
  selectedTags.push("RESERVEDTAG1");
  selectedTags.push("RESERVEDTAG2");
  gfs.files.updateOne(
    { _id: mongoose.Types.ObjectId(fileId) },
    { $set: { 'metadata.tags': selectedTags } },
    (err) => {
      if (err) return res.status(500).json({ err });
      res.redirect('/users/upload'); // Redirect back to the main page or wherever needed
    }
  );
});


// @route GET /users/upload
// @desc Loads upload form




// @route GET /files
// @desc  Display all files in JSON
app.get('/files', (req, res) => {
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

// @route GET /files/:filename
// @desc  Display single file object
app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    return res.json(file);
  });
});

// @route GET /image/:filename
// @desc Display Image
app.get('/image/:filename', (req, res) => {
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

// @route DELETE /files/:id
// @desc  Delete file
app.delete('/files/:id', (req, res) => {
  console.log('delete');
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }

    res.redirect('/users/upload');
  });
});

// User registration route
app.post('/register', async (req, res) => {
  console.log("register post");
  const { name, email, password } = req.body;

  try {
      // Create a new user instance
      const newUser = new UserModel({ name, email, password });

      // Save the user to the database
      await newUser.save();
      console.log("yay we saved the user");
      res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
      console.log("nope")
      console.log(error);
      res.status(400).json({ error: error.message });
  }
});

app.post('/newtags', async (req, res) => {
  try {
    const newTag = new TagModel({ name: req.body.name });
    await newTag.save();
    console.log("redirect");
    res.redirect('/users/newtags'); // Redirect to the tags list after creation
  } catch (error) {
    console.log("error");
    console.error(error);
    res.status(500).send("Server Error");
  }
});





const port = 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));
