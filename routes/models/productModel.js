const mongoose = require("mongoose");
const Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

const ProductSchema = new mongoose.Schema({
	name:{
        type: String,
        required:true,
        unique:true
    },
	description:{
        type: String,
        required:true
    },
    price:{
        type: Number,
        required: true,
        trim: true
    },
    per:{
        type: String,
        required: true,
        enum: ['KG', 'halfKG', 'quarterKG']
    },
    images:[{
        type: String,
        required:false,
    }]
}, {
	timestamps: true,
	collection: "products"
});

module.exports = mongoose.model('Product', ProductSchema);