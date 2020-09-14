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
	address: {
		type: Object,
		required: true,
	},
	status:{
		type: String,
		required: true,
		default: 'pending',
		enum:['pending', 'complete', 'archived'],
	}
}, {
	timestamps: true,
	collection: "orders"
});

module.exports = mongoose.model('Order', OrderSchema);