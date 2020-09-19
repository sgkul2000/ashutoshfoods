const express = require('express');
const hbs = require('express-handlebars');
const Handlebars = require("handlebars");
const router = express.Router();

const jwt = require("jsonwebtoken");

const User = require("./models/userModel");
const Order = require("./models/orderModel");
const Product = require("./models/productModel");
const Address = require("./models/addressModel");

function authenticateToken(req, res, next) {
	// Gather the jwt access token from the request header
	const authHeader = req.headers['authorization']
	// const token = authHeader && authHeader.split(' ')[1]
	// const token = authHeader
	const token =  authHeader.split(' ')[1] || authHeader
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
	// const token = authHeader && authHeader.split(' ')[1]
	// const token = authHeader
	const token =  authHeader.split(' ')[1] || authHeader
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
	if ((req.user.isAdmin === true)) {
		if (parseInt(req.query.all) === 1) {
			params = {}
		} else if (parseInt(req.query.completed) === 1) {
			params = {
				status: 'complete'
			}
		} else if (parseInt(req.query.completed) === 0) {
			params = {
				status: 'pending'
			}
		} else if (req.query.id) {
			params = {
				_id: req.query.id,
			}
		}
	} else {
		if (req.query.id) {
			// params = {
			// 	_id: req.query.id,
			// 	user: req.user.id
			// }
			params._id = req.query.id
		}
	}
	Order.find(params, null, {
		sort: {
			'createdAt': -1
		}
	}).populate('user').populate('cart').exec((err, orders) => {
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
	var orderAddress = await Address.findById(req.body.address, (err, address) => {
		if (err) {
			console.error(err)
			return res.status(400).send({
				success: false,
				error: err
			})
		}
		return address
	})
	const newOrder = new Order({
		user: req.user.id,
		amount: amount,
		cart: req.body.cart,
		address: orderAddress
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
			console.error(err)
			return res.status(400).send({
				success: false,
				error: err
			})
		}
		// console.log(order)
		// console.log(req.user.id ,order.user)
		if (req.user.id.toString() !== order.user.toString()) {
			if(!(parseInt(req.query.forcedelete) === 1 && req.user.isAdmin === true)){
				return res.status(401).send({
					success: false,
					message: "Unauthorized user"
				})
			}
		}
		User.findById(req.user.id, async (err, user) => {
			if (err) {
				console.error(err)
				return res.status(400).send({
					success: false,
					error: err
				})
			}
			var arrayIndex = await user.orders.indexOf(req.params.id)
			await user.orders.splice(arrayIndex, 1)
			await user.save((err, savedUser) => {
				if (err) {
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

router.put('/:id', authenticateTokenAdmin, (req, res) => {
	console.log(req.params.id, req.body)
	Order.findById(req.params.id, (err, order) => {
		if (err) {
			console.error(err)
			return res.status(400).send({
				success: false,
				error: err
			})
		}
		order.status = req.body.status
		order.save((error, savedOrder) => {
			if (error) {
				console.error(error)
				return res.status(400).send({
					success: false,
					error: error
				})
			}
			res.send({
				success: true,
				data: savedOrder
			})
		})
	})
})

module.exports = router