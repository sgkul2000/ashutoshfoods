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
	if (token == null) return res.sendStatus(401) // if there isn't any token

	jwt.verify(token, process.env.PRIVATE_KEY, (err, user) => {
		// console.log(err)
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
		// console.log(err)
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

router.get('/', authenticateToken, (req, res) => {
	let params = {
		user: req.user.id
	}
	if ((req.user.isAdmin === true) && (parseInt(req.query.all) === 1)) {
		params = {}
	}
	Order.find(params).populate('user').populate('cart').exec((err, orders) => {
		if (err) {
			console.error(err)
			return res.status(400).send({
				success: false,
				error: err
			})
		}
		res.send({
			success: true,
			data: orders
		})
	})
});

router.post('/', authenticateToken, async (req, res) => {
	console.log(req.body)
	var cartProducts = await Product.find({}, async (err, products) => {
		if (err) {
			return res.status(400).send({
				success: false,
				error: err
			})
		}
		return products
	})
	var productList = await cartProducts.filter((product) => {
		return req.body.cart.includes(product._id.toString())
	})
	var amount = 0
	for (let index = 0; index < productList.length; index++) {
		// await console.log('product price', productList[index].price)
		amount += await productList[index].price
	}
	const newOrder = new Order({
		user: req.user.id,
		amount: amount,
		cart: req.body.cart
	})
	savedOrder = await newOrder.save(async (err, savedOrder) => {
		if (err) {
			console.error(err)
			return res.status(400).send({
				success: false,
				error: err
			})
		}

		User.findById({
			_id: req.user.id
		}, (error, orderedUser) => {
			if (error) {
				console.error(error)
				return res.status(400).send({
					success: false,
					error: error
				})
			}
			// console.log(orderedUser)
			orderedUser.orders.push(savedOrder._id)
			orderedUser.save(async (err, updatedUser) => {
				if (err) {
					console.error(err)
					res.status(400).send({
						success: false,
						error: err
					})
				}
				// console.log(updatedUser)
				await savedOrder.populate('cart')
				await savedOrder.populate('user').execPopulate()
				res.send({
					success: true,
					data: savedOrder
				})
			})
		})
	})
})

router.delete('/:id', authenticateToken, (req, res) => {
	Order.findById(req.params.id, (err, order) => {
		if (err) {
			console.status(400).error(err)
			return res.send({
				success: false,
				error: err
			})
		}
		console.log(order)
		console.log(req.user.id !== order.user)
		if( req.user.id !== order.user){
			return res.status(401).send({
				success: false,
				error:"Unauthorized user"
			})
		}
		User.findById(req.user.id, async (err, user) => {
			if(err){
				console.error(err)
				return res.status(400).send({
					success:false,
					error:err
				})
			}
			var arrayIndex = await user.orders.indexOf(req.params.id)
			await user.orders.splice(arrayIndex, 1)
			await user.save((err, savedUser) => {
				if(err){
					console.error(err)
					return res.status(400).send({
						success: false,
						error: err
					})
				}
				console.log(savedUser)
			})
		})
		order.remove((error, removedOrder) => {
			if (error) {
				console.error(error)
				return res.status(400).send({
					status: false,
					error: error
				})
			}
			removedOrder.populate('user').execPopulate()
			res.send({
				success: true,
				data: removedOrder
			})
		})
	});
});

module.exports = router