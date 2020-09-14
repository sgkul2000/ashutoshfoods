const mongoose = require("mongoose");
const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

const AddressSchema = new mongoose.Schema({
    flat: {
        type: String,
        required: true
    },
    buildingName: {
        type: String,
        required: true
    },
    area: {
        type: String,
        required: true
    },
    landmark: {
        type: String,
        required: false
    },
    cityName: {
        type: String,
        required: true
    },
    stateName: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true,
        trim: true
    },
    gpsLocation: {
        type: String,
        required: false
    }
}, {
    timestamps: true,
    collection: "addresss"
});

module.exports = mongoose.model('Address', AddressSchema);