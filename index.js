const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv/config');
const Audience = require('./models/Audience');
const Creator = require('./models/Creator');
const Exclusive = require('./models/Exclusive');

const path = require('path');
const multer = require('multer');
const Project = require('./models/Project');
const { replaceOne } = require('./models/Audience');
const async = require('async');

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// // Get data from device
// app.post('/data', (req, res) => {
//   Device.updateOne(
//     { esn: req.body.esn },
//     {
//       $set: {
//         temp: req.body.temp,
//         hum: req.body.hum,
//         soil: req.body.soil,
//         relay1: req.body.relay1,
//         relay2: req.body.relay2,
//         relay3: req.body.relay3,
//         relay4: req.body.relay4,
//         timestamp: req.body.timestamp,
//       },
//     }
//   )
//     .then((data) => res.json({ responestatus: '1' }))
//     .catch((error) => {
//       res.json({ responsestatus: '0' });
//     });
// });

app.use(express.static('public'));

app.post('/users/new', (req, res) => {
  if (req.body.userType === 'creator') {
    const creator = new Creator({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      pageName: req.body.pageName,
      category: req.body.category,
      email: req.body.email,
      password: req.body.password,
      description: req.body.description,
    });

    Creator.create(creator, (err, creator) => {
      console.log(err);
      res.send(creator);
    });
  } else {
    const audience = new Audience({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
    });
    Audience.create(audience, (err, audience) => {
      console.log(err);
      res.send(audience);
    });
  }
});

app.post('/upload/creator/profile/image/:pageName', (req, res) => {
  const pageName = req.params.pageName;
  const storage = multer.diskStorage({
    destination: './public/images/creators/' + pageName + '/profile',
    filename: function (req, file, cb) {
      cb(null, pageName + path.extname(file.originalname));
    },
  });

  const upload = multer({
    storage: storage,
  }).single('profileImage');

  upload(req, res, (err) => {
    console.log('Request file: ', req.file);
    if (!err) return res.send(200);
  });
});

app.post('/users/login', (req, res) => {
  if (req.body.userType === 'creator') {
    Creator.findOne({ email: req.body.email }).then((data) => res.send(data));
  } else {
    Audience.findOne({ email: req.body.email }).then((data) => res.send(data));
  }
});

app.post('/projects/new', (req, res) => {
  const project = new Project({
    email: req.body.email,
    pageName: req.body.pageName,
    title: req.body.title,
    description: req.body.description,
    amount: req.body.amount,
  });

  Project.create(project, (err, project) => {
    console.log(err);
    res.send(project);
  });
});

app.post('/projects/upload/:pageName', (req, res) => {
  const pageName = req.params.pageName;
  const storage = multer.diskStorage({
    destination:
      './public/images/creators/' +
      pageName +
      '/projects/' +
      req.query.projectName,
    filename: function (req, file, cb) {
      cb(null, req.query.projectName + path.extname(file.originalname));
    },
  });

  const upload = multer({
    storage: storage,
  }).single('projectImage');

  upload(req, res, (err) => {
    console.log('Request: ', req.body);
    console.log('Request file: ', req.file);
    if (!err) return res.send(200);
  });
});

app.get('/projects', (req, res) => {
  if (req.query.email) {
    Project.find({ email: req.query.email }).then((data) => res.send(data));
  } else {
    Project.find({}).then((data) => res.send(data));
  }
});

app.get('/creators', (req, res) => {
  if (req.query.email && req.query.pageName) {
    Creator.find({ email: req.query.email }).then((data) => res.send(data));
  } else {
    Creator.find().then((data) => res.send(data));
  }
});

app.post('/creator/subscribe', (req, res) => {
  Creator.findOneAndUpdate(
    { pageName: req.body.pageName },
    {
      $push: {
        audience: {
          audienceEmail: req.body.audienceEmail,
          amount: req.body.amount,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
        },
      },
    }
  ).then(() =>
    Audience.findOneAndUpdate(
      { email: req.body.audienceEmail },
      {
        $push: {
          creators: {
            pageName: req.body.pageName,
            amount: req.body.amount,
          },
        },
      }
    ).then(() => res.send('subscribed'))
  );
});

app.post('/creator/project/pledge', (req, res) => {
  console.log(req.body.projectTitle, req.body.pageName);
  Project.findOneAndUpdate(
    { title: req.body.projectTitle, pageName: req.body.pageName },
    {
      $push: {
        audience: {
          audienceEmail: req.body.audienceEmail,
          amount: req.body.amount,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          timestamp: req.body.timestamp,
        },
      },
    }
  ).then(() => res.send('pledged'));
});

app.post('/creator/funds/audience', (req, res) => {
  Creator.findOne({ pageName: req.body.pageName }).then((data) =>
    res.send(data)
  );
});

app.post('/creator/funds/projects', (req, res) => {
  Project.find({ pageName: req.body.pageName }).then((data) => res.send(data));
});

app.post('/creator/exclusive/view', (req, res) => {
  Exclusive.find({ pageName: req.body.pageName }).then((data) =>
    res.send(data)
  );
});

app.post('/creator/exclusive/new', (req, res) => {
  const exclusive = new Exclusive({
    email: req.body.email,
    pageName: req.body.pageName,
    title: req.body.title,
    description: req.body.description,
  });

  Exclusive.create(exclusive, (err, exclusive) => {
    console.log(err);
    res.send(exclusive);
  });
});

app.post('/exclusive/upload/:pageName', (req, res) => {
  const pageName = req.params.pageName;
  const storage = multer.diskStorage({
    destination:
      './public/file/creators/' + pageName + '/exclusive/' + req.query.title,
    filename: function (req, file, cb) {
      cb(null, req.query.title + path.extname(file.originalname));
    },
  });

  const upload = multer({
    storage: storage,
  }).single('contentFile');

  upload(req, res, (err) => {
    console.log('Request: ', req.body);
    console.log('Request file: ', req.file);
    if (!err) return res.send(200);
  });
});

app.post('/audience/info', (req, res) => {
  Audience.findOne({ pageName: req.body.email }).then((data) => res.send(data));
});

app.post('/creators/exclusive', async (req, res) => {
  console.log(req.body.pageNames);
  let pageNames = req.body.pageNames;
  let creators = [];

  pageNames.forEach(async (element, index) => {
    let data = await Exclusive.find({ pageName: element });
    creators.push(...data);
    if (index === pageNames.length - 1) {
      console.log(creators);
      res.send(creators);
    }
  });
});

mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true }, () => {
  console.log('Connected to database!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT);
