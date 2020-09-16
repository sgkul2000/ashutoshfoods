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
	const token = authHeader
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
	const token = authHeader
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
	var params = {
		email: req.user.email
	}
	User.findOne(params, async (err, user) => {
		if (err) {
			console.error(err)
			return res.status(400).send({
				success: false,
				error: err
			})
		}
		// await user.populate('orders')
		await user.populate('addresses').execPopulate()
		console.log(user.addresses)
		res.send({
			success: true,
			data: user.addresses
		})
	})
})

router.get('/:id', authenticateToken, (req, res) => {
	var params = {
		email: req.user.email
	}
	User.findOne(params, async (err, user) => {
		if (err) {
			console.error(err)
			return res.status(400).send({
				success: false,
				error: err
			})
		}
		// await user.populate('orders')
		await user.populate('addresses').execPopulate()
		var requiredAddress = await user.addresses.filter((element) => {
			return element._id.toString() === req.params.id.toString()
		})
		console.log(user.addresses)
		res.send({
			success: true,
			data: requiredAddress[0]
		})
	})
})
router.post('/', authenticateToken, (req, res) => {
	console.log(req.body)
	var address = new Address({
		flat: req.body.flat,
		buildingName: req.body.buildingName,
		area: req.body.area,
		landmark: req.body.landmark,
		cityName: req.body.cityName,
		stateName: req.body.stateName,
		pincode: req.body.pincode,
		gpsLocation: req.body.gpsLocation,
	})
	address.save((err, savedAddress) => {
		if (err) {
			console.error(err)
			return res.status(400).send({
				success: false,
				error: err
			})
		}
		User.findOne({
			email: req.user.email
		}, (error, user) => {
			if (error) {
				console.error(error)
				return res.status(401).send({
					success: false,
					error: error
				})
			}
			console.log(savedAddress._id)
			user.addresses.push(savedAddress._id)
			user.save((err, savedUser) => {
				if (err) {
					console.error(err)
					return res.status(400).send({
						success: false,
						error: err
					})
				}
				res.send({
					success: true,
					data: savedAddress
				})
			})
		})
	})
})


router.delete('/:id', authenticateToken, async (req, res) => {
	Address.findById(req.params.id, (err, address) => {
		if (err) {
			console.error(err)
			return res.status(400).send({
				success: false,
				error: err
			})
		}
		User.findById(req.user.id, async (err, user) => {
			if (err) {
				console.error(err)
				return res.status(400).send({
					success: false,
					error: err
				})
			}
			var arrayIndex = await user.addresses.indexOf(req.params.id)
			await user.addresses.splice(arrayIndex, 1)
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
		address.remove((err, deletedAddress) => {
			if (err) {
				console.error(err)
				return res.status(400).send({
					success: false,
					error: err
				})
			}
			res.send({
				success: true,
				data: deletedAddress
			})
		})
	})
})

router.put('/:id', authenticateToken, (req, res) => {
	Address.findById(req.params.id, (err, address) => {
		if (err) {
			console.error(err)
			return res.status(400).send({
				success: false,
				error: err
			})
		}
		address.flat = req.body.flat
		address.buildingName = req.body.buildingName
		address.area = req.body.area
		address.landmark = req.body.landmark
		address.cityName = req.body.cityName
		address.stateName = req.body.stateName
		address.pincode = req.body.pincode
		address.gpsLocation = req.body.gpsLocation
		address.save((err, savedAddress) => {
			if (err) {
				console.error(err)
				return res.status(400).send({
					success: false,
					error: err
				})
			}
			res.send({
				success: true,
				data: savedAddress
			})
		})
	})
})

module.exports = router