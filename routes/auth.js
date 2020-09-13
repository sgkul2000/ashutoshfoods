const express = require('express');
const hbs = require('express-handlebars');
const Handlebars = require("handlebars");
const router = express.Router();


const JsonWebToken = require("jsonwebtoken");
const mongoose = require("mongoose");
mongoose.set('useCreateIndex', true);
const Bcrypt = require("bcrypt");

// const process.env.PRIVATE_KEY = "shco97S6CSDCNJ"
const User = require("./models/userModel");
const Order = require("./models/orderModel");
const Product = require("./models/productModel");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})





router.post("/signup", (req, res) => {
  console.log(req.body);
  if ((!req.body.username && !req.body.email) || !req.body.password) {
    res.json({
      auth: false,
      error: "Parameters missing"
    });
    return
  }

  User.create({
    email: req.body.email,
    username: req.body.username,
    password: Bcrypt.hashSync(req.body.password, 8),
    fullname: req.body.fullname
  }).then((user) => {
    const token = JsonWebToken.sign({
      id: user._id,
      email: user.email,
      username: user.username,
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
        const token = JsonWebToken.sign({
          id: user._id,
          email: user.email,
          username: user.username,
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







module.exports = router
