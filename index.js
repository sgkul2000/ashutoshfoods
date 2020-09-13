const express = require('express');
const BodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const hbs = require('express-handlebars');
const Handlebars = require("handlebars");
const morgan = require('morgan')
const dotenv = require('dotenv')


dotenv.config();

const authRouter = require('./routes/auth');
const productRouter = require('./routes/product');
const logger = morgan('dev', {
  // skip: function (req, res) { return res.statusCode < 400 }
})


const app = express();
app.use(logger)
app.engine('hbs', hbs({extname: 'hbs', defaultLayout: 'layout', layoutDir: __dirname + '/views/layouts/', partialsDir: __dirname+'/views/partials/'}))
app.use(cors());
app.use(BodyParser.json());
app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use("/api/auth", authRouter);
app.use("/api/product", productRouter);
app.get('/index', (req, res) => {
  res.render('index.hbs');
});
// app.use('/', routes);
port = process.env.PORT || 8000;


app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});
