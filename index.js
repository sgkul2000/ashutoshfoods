const express = require('express');
const BodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const hbs = require('express-handlebars');
const Handlebars = require("handlebars");
const morgan = require('morgan')
const dotenv = require('dotenv')
const mongoose = require('mongoose')


// establishing environment variable 
dotenv.config();

// importing routes
const authRouter = require('./routes/auth');
const productRouter = require('./routes/product');
const orderRouter = require('./routes/order');
const viewRouter = require('./routes/view');

// setting up mongoose database
mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// logger for incoming requests
const logger = morgan('dev', {
  // skip: function (req, res) { return res.statusCode < 400 }
})

// registering helper
Handlebars.registerHelper('prod', () => {
  return process.env.NODE_ENV === 'production';
})

const app = express();

// middleware
app.use(logger)

// declaring handlebars
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutDir: __dirname + '/views/layouts/', partialsDir: __dirname+'/views/partials/'}))
app.set('view engine', 'hbs');

app.use(cors());
app.use(BodyParser.json());

// setting static folder to "public"
app.use(express.static('public'));

// including routes
app.use("/api/auth", authRouter);
app.use("/api/product", productRouter);
app.use("/api/order", orderRouter);

// view route
app.use('/', viewRouter);
// app.use('/', routes);

// setting port
port = process.env.PORT || 8000;

// establishing server
app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});
