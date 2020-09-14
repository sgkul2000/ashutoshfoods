const express = require('express');
const hbs = require('express-handlebars');
const Handlebars = require("handlebars");
const router = express.Router();
var nodemailer = require('nodemailer');

const jwt = require("jsonwebtoken");
const Bcrypt = require("bcrypt");

const User = require("./models/userModel");
const Order = require("./models/orderModel");
const Product = require("./models/productModel");




router.post("/signup", (req, res) => {
  console.log(req.body);
  if ((!req.body.username && !req.body.email) || !req.body.password) {
    res.json({
      auth: false,
      error: "Parameters missing"
    });
    return
  }
  try {
    var isAdmin
    if (req.body.SECRET_KEY === process.env.PRIVATE_KEY) {
      isAdmin = true
    } else {
      isAdmin = false
    }
  } catch (err) {
    console.error(err)
  }
  User.create({
    email: req.body.email,
    username: req.body.username,
    password: Bcrypt.hashSync(req.body.password, 8),
    fullname: req.body.fullname,
    isAdmin: isAdmin
  }).then((user) => {
    const token = jwt.sign({
      id: user._id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin
    }, process.env.PRIVATE_KEY, {
      expiresIn: 86400
    });
    let userObj = JSON.parse(JSON.stringify(user))
    delete userObj['password']
    res.json({
      auth: true,
      token: token,
      user: userObj
    });
  }).catch((err) => {
    res.json({
      auth: false,
      error: err
    });

  })
  // res.status(201).send();
});




router.post("/login", (req, res) => {
  console.log(req.body);
  if (!req.body.email || !req.body.password) {
    res.json({
      auth: false,
      error: "Parameters missing"
    });
    return
  }

  User.findOne({
    email: req.body.email
  }).then((user) => {
    if (!user) {
      res.json({
        auth: false,
        error: "User does not exist"
      })
    } else {
      if (!Bcrypt.compareSync(req.body.password, user.password)) {
        res.json({
          auth: false,
          error: "Password is incorrect!"
        });
      } else {
        const token = jwt.sign({
          id: user._id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin
        }, process.env.PRIVATE_KEY, {
          expiresIn: 86400
        });
        let userObj = JSON.parse(JSON.stringify(user))
        delete userObj['password']
        res.json({
          auth: true,
          token: token,
          user: userObj
        });
      }
    }
  }).catch((err) => {
    console.log(err);
    res.json({
      auth: false,
      error: err
    });

  })
  // res.status(201).send();
});


router.get('/resetpassword', (req, res) => {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'ashutoshfoods.belgaum@gmail.com',
      pass: process.env.MAIL_PASSWORD
    }
  });

  var mailOptions = {
    from: 'youremail@gmail.com',
    to: 'shreeshkulkarni17@gmail.com',
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  res.status(200).send()
})




module.exports = router