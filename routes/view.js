const express = require('express');
const hbs = require('express-handlebars');
const Handlebars = require("handlebars");
const router = express.Router();


const JsonWebToken = require("jsonwebtoken");
const Bcrypt = require("bcrypt");

// const process.env.PRIVATE_KEY = "shco97S6CSDCNJ"
const User = require("./models/userModel");
const Order = require("./models/orderModel");
const Product = require("./models/productModel");

router.get('/', (req, res) => {
    res.render('index')
})

module.exports = router