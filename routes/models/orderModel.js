const mongoose = require("mongoose");
const Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

const OrderSchema = new mongoose.Schema({
	amount: {
		type: Number,
		required: true,
		trim: true
	},
	cart: [{
		type: mongoose.Schema.ObjectId,
		required: true,
		ref: "Product"
	}],
	user: {
		type: mongoose.Schema.ObjectId,
		required: true,
		ref: "User"
	},
}, {
	timestamps: true,
	collection: "orders"
});

module.exports = mongoose.model('Order', OrderSchema);