const express = require('express');
const hbs = require('express-handlebars');
const Handlebars = require("handlebars");
const router = express.Router();


const JsonWebToken = require("jsonwebtoken");
const mongoose = require("mongoose");
mongoose.set('useCreateIndex', true);
const Bcrypt = require("bcrypt");

// const SECRET_JWT_CODE = "shco97S6CSDCNJ"
const User = require("./models/userModel");
const Order = require("./models/orderModel");
const Product = require("./models/productModel");


mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true
})

function authenticateToken(req, res, next) {
	// Gather the jwt access token from the request header
	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split(' ')[1]
	console.log(token)
	if (token == null) return res.sendStatus(401) // if there isn't any token

	jwt.verify(token, process.env.PRIVATE_KEY, (err, user) => {
		console.log(err)
		if (err) return res.sendStatus(403)
		req.user = user
		next() // pass the execution off to whatever request the client intended
	})
}


router.get('/', async (req, res) => {
	// console.log(req.body)
	try {
		const products = await Product.find()
		res.send({
			success: true,
			data: products
		})
	} catch (err) {
		console.error(err)
		res.status(404).send({
			success: false,
			error: error
		})
	}
});

router.post('/', (req, res) => {
	// console.log(req.body)
	let product = new Product({
		name: req.body.name,
		description: req.body.description,
		price: req.body.price,
		per: req.body.per,
	})
	product.save((error, product) => {
		if (error) {
			console.error(error)
			res.status(404).send({
				success: false,
				error: error
			})
		}
		console.log(product)
		res.status(201).send({
			success: true,
			data: product
		})
	});
})

router.delete('/:id', (req, res) => {
	// console.log(req.params.id)
	Product.findById(req.params.id, (err, product) => {
		if (err) {
			console.error(err)
			res.status(400).send({
				success: false,
				error: err
			})
		}
		product.remove((error, product) => {
			if (error) {
				console.error(error)
				res.status(500).send({
					success: false,
					error: err
				})
			}
			res.send({
				success: true,
				product: product
			})
		})
	});
});

router.put('/:id', (req, res) => {
	console.log(req.params.id)
	console.log(req.body)
	Product.findById(req.params.id, (err, product) => {
		console.log('product', product)
		if (err) {
			console.log('theres an error here', err)
			res.status(400).send({
				success: false,
				error: err
			})
		}
		product.name = req.body.name
		product.description = req.body.description
		product.price = req.body.price
		product.per = req.body.per
		product.save((error, newProduct) => {
			if (error) {
				console.error(error)
				res.status(500).send({
					success: false,
					error: err
				})
			}
			res.send({
				success: true,
				product: newProduct
			})
		})
	});
})


module.exports = router