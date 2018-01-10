const express = require('express');
const bodyPaser = require('body-parser');
const session = require('express-session');
const massive = require('massive');
const bcrypt = require('bcrypt');

const saltRounds = 12;

require('dotenv').config();
const app = express();
massive(process.env.CONNECTION_STRING).then(db => app.set('db', db));

app.use(bodyPaser.json());
app.use(session({
  secret: "mega hyper ultra secret",
  saveUninitialized: false,
  resave: false,
}));
app.use(express.static(`${__dirname}/../build`));

app.post('/register', (req, res) => {
    // Add code here
  const db = app.get('db')
  bcrypt.hash(req.body.password, saltRounds).then(hashedPassword => {
    db.create_user([req.body.username, hashedPassword]).then(()=>
      {
        req.session.user = req.body.username;
        res.json({user:req.session.user})
      }).catch(error => {
        console.log('error',error);
        res.status(500).json({message: 'Something went wrong'})
      })
  })
});

app.post('/login', (req, res) => {
  //add code here
  const db = app.get('db');
  const { username, password } = req.body;
  db.find_user([username]).then(users => {
    if (users.length) {
      if (users[0].password === password) {
        req.session.user = { username: users[0].username };
        res.json({ user: req.session.user });
      } else {
        res.status(403).json({ message: 'Wrong password' })
      }
    } else {
      res.status(403).json({ message: "That user is not registered" })
    }
  })
});

app.post('/logout', (req, res) => {
  // Add code here
});

function ensureLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(403).json({ message: 'You are not authorized' });
  }
}

app.get('/secure-data', ensureLoggedIn, (req, res) => {
  res.json({ someSecureData: 123 });
});

const PORT = 3030;
app.listen(PORT, () => {
  console.log('Server listening on port ' + PORT);
});
