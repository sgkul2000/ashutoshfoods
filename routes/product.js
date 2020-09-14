const express = require('express');
const hbs = require('express-handlebars');
const Handlebars = require("handlebars");
const router = express.Router();

const jwt = require("jsonwebtoken");

const User = require("./models/userModel");
const Order = require("./models/orderModel");
const Product = require("./models/productModel");

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

function authenticateTokenAdmin(req, res, next) {
	// Gather the jwt access token from the request header
	const authHeader = req.headers['authorization']
	const token = authHeader && authHeader.split(' ')[1]
	if (token == null) return res.sendStatus(401) // if there isn't any token

	jwt.verify(token, process.env.PRIVATE_KEY, (err, user) => {
		console.log(err)
		if (err) return res.sendStatus(403)
		if (user.isAdmin) {
			req.user = user
			next()
		} else {
			return res.sendStatus(403)
		}
		// next() // pass the execution off to whatever request the client intended
	})
}


router.get('/', async (req, res) => {
	// console.log(req.body)
	let params = {}
	if(req.query.category){
		console.log(req.query.category)
		params = {
			"category": req.query.category
		}
	}
	if(req.query.id){
		params._id = req.query.id
	}
	if(req.query.search){
		params.name = {
			$regex : req.query.search,
			$options: 'i'
		}
	}
	try {
		const products = await Product.find(params)
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

router.post('/', authenticateTokenAdmin, (req, res) => {
	// console.log(req.body)
	let product = new Product({
		name: req.body.name,
		description: req.body.description,
		price: req.body.price,
		per: req.body.per,
		category: req.body.category
	})
	product.save((error, product) => {
		if (error) {
			console.error(error)
			return res.status(404).send({
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

router.delete('/:id', authenticateTokenAdmin, (req, res) => {
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
				return res.send({
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

router.put('/:id', authenticateTokenAdmin, (req, res) => {
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
		if(req.body.name){
			product.name = req.body.name
		}
		if(req.body.description){
			product.description = req.body.description
		}
		if(req.body.price){
			product.price = req.body.price
		}
		if(req.body.per){
			product.per = req.body.per
		}
		if(req.body.isAvailable){
			product.isAvailable = req.body.isAvailable
		}
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