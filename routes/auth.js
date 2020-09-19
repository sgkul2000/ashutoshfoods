const express = require('express');
const hbs = require('express-handlebars');
const Handlebars = require("handlebars");
const router = express.Router();
var nodemailer = require('nodemailer');

const jwt = require("jsonwebtoken");
const Bcrypt = require("bcrypt");

const User = require("./models/userModel");
const Order = require("./models/orderModel");
const Product = require("./models/productModel");
const Address = require("./models/addressModel");


function authenticateToken(req, res, next) {
  // Gather the jwt access token from the request header
  const authHeader = req.headers['authorization']
  const token =  authHeader.split(' ')[1] || authHeader
  // const token = authHeader && authHeader.split(' ')[1]
  // const token = authHeader
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
  User.findOne({
    email: req.user.email
  }, async (err, user) => {
    if (err) {
      console.error(err)
      return res.status(400).send({
        success: false,
        error: err
      })
    }
    await user.populate('orders')
    await user.populate('addresses').execPopulate()
    console.log(user)
    res.send({
      success: true,
      data: user
    })
  })
})

router.get('/admin', authenticateTokenAdmin, (req, res) => {
  User.find({isAdmin: true}, (err, admins) => {
    if(err){
      console.error(err)
      return res.status(400).send({
        success: false,
        error: err
      })
    }
    res.send({
      success: true,
      data: admins
    })
  })
})

router.post("/signup", (req, res) => {
  console.log(req.body);
  if ((!req.body.username && !req.body.email) || !req.body.password) {
    res.json({
      auth: false,
      error: "Parameters missing"
    });
    return
  }
  try {
    var isAdmin
    if (req.body.SECRET_KEY === process.env.PRIVATE_KEY) {
      isAdmin = true
    } else {
      isAdmin = false
    }
  } catch (err) {
    console.error(err)
  }
  User.create({
    email: req.body.email,
    username: req.body.username,
    password: Bcrypt.hashSync(req.body.password, 8),
    fullname: req.body.fullname,
    phone: req.body.phone,
    isAdmin: isAdmin
  }).then((user) => {
    const token = jwt.sign({
      id: user._id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin
    }, process.env.PRIVATE_KEY, {
      expiresIn: 86400
    });
    let userObj = JSON.parse(JSON.stringify(user))
    delete userObj['password']
    res.json({
      auth: true,
      token: token,
      user: userObj
    });
  }).catch((err) => {
    res.json({
      auth: false,
      error: err
    });

  })
  // res.status(201).send();
});




router.post("/login", (req, res) => {
  console.log(req.body);
  if (!req.body.email || !req.body.password) {
    res.json({
      auth: false,
      error: "Parameters missing"
    });
    return
  }

  User.findOne({
    email: req.body.email
  }).then((user) => {
    if (!user) {
      res.json({
        auth: false,
        error: "User does not exist"
      })
    } else {
      if (!Bcrypt.compareSync(req.body.password, user.password)) {
        res.json({
          auth: false,
          error: "Password is incorrect!"
        });
      } else {
        const token = jwt.sign({
          id: user._id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin
        }, process.env.PRIVATE_KEY, {
          expiresIn: 86400
        });
        let userObj = JSON.parse(JSON.stringify(user))
        delete userObj['password']
        res.json({
          auth: true,
          token: token,
          user: userObj
        });
      }
    }
  }).catch((err) => {
    console.log(err);
    res.json({
      auth: false,
      error: err
    });

  })
  // res.status(201).send();
});


router.post('/resetpassword', (req, res) => {
  console.log(req.body)
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASSWORD
    }
  });
  params = {}
  if (req.body.username) {
    params = {
      username: req.body.username
    }
  } else if (req.body.email) {
    params = {
      email: req.body.email
    }
  }
  if (params === {}) {
    return res.status(400).send({
      success: false,
      error: "Missing parameters"
    })
  }
  User.findOne(params, (err, user) => {
    if (err) {
      console.error(err)
      return res.status(400).send({
        success: false,
        error: err
      })
    }
    console.log(user)
    var resetToken = jwt.sign({
      username: user.username,
      email: user.email,
    }, process.env.PRIVATE_KEY, {
      expiresIn: 600
    })
    var resetLink = "http://localhost:8000/api/auth/reset/" + resetToken
    var mailOptions = {
      from: process.env.MAIL_ID,
      to: user.email,
      subject: 'Ashutosh Foods password reset.',
      html: `
      <style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat&display=swap');
*{
    font-family: 'Montserrat', sans-serif;
    color: #222;
}
body{
    margin: 0;
}
.mainWrapper{
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 2rem 0 0 0;
    position: relative;
    background-image: url('https://ashutoshfoods.herokuapp.com/init/pexels-polina-tankilevitch-3872428.jpg') !important;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;

}
.messageModal{
    width: 80%;
    /* background-color: #eee; */
    background-color: #f9f9f9;
    border-radius: 10px;
    box-shadow: 1px 2px 10px rgba(0, 0, 0, 0.4);
    padding: 2rem 2rem;
}
.messageHeader{
    font-size: 1.6rem;
    text-align: center;

}
.highlight{
    text-decoration: underline;
    color: #4286f4;
}
.messageContent{
    padding: 1rem 1rem;
    line-height: 1.5rem;
}
.messageFooterWrapper{
    width: 100%;
}
.messageFooter{
    padding: 2rem 2rem 2rem 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    color: #444;
    background-color: rgba(255, 255, 255, 0.8);
    margin-top: 2rem;
}
</style>
<div class="mainWrapper">
    <div class="messageModal">
        <h1 class="messageHeader">Ashutosh Foods</h1>
        <p class="messageContent">
            Greetings, <br><br>
            We recieved a password reset request for <a href="mailto:${user.email}" class="highlight">${user.email}</a><br>
            Please click <a href="${resetLink}" class="highlight">here</a> to reset your password.<br>
            If the above link does not work for you, please copy and paste the following into your browser address bar:<br>
            <a href="${resetLink}" class="highlight">${resetLink}</a><br><br>
            Thank you,<br>
            Ashutosh Foods Technical Support.
        </p>
    </div>
    <div class="messageFooterWrapper">
        <div class="messageFooter">
            <p>    
                You are receiving this email because <a href="mailto:${user.email}" class="highlight">${user.email}</a> is registered on Ashutosh Foods.<br>
                Please do not reply directly to this email. If you have any questions or feedback, please visit our <a class="highlight" href="https://ashutoshfoods.heroku-app.com/">support website</a>.
            </p>
        </div>
    </div>
</div>
      `
    };

    // transporter.sendMail(mailOptions, function (error, info) {
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     console.log('Email sent: ' + info.response);
    //   }
    // });
    res.send({
      resetToken: resetToken
    })
  })

  // res.status(200).send()
})



router.get('/resetpassword/:token', async (req, res) => {
  try {
    var token = await jwt.decode(req.params.token)
    // var newToken = await jwt.sign({
    //   username: token.username,
    //   email: token.email
    // }, process.env.PRIVATE_KEY, {expiresIn: 600})
  } catch (err) {
    return res.status(404).send()
  }
  res.send({
    token: token
  })
})

router.post('/reset/', (req, res) => {
  var token
  if (!req.body.password) {
    return res.status(400).send({
      success: false,
      error: "Missing password"
    })
  }
  try {
    token = jwt.decode(req.body.token)
  } catch (err) {
    return res.status(401)
  }
  User.findOne({
    email: token.email
  }, (err, user) => {
    if (err) {
      console.error(err)
      return res.status(400).send({
        success: false,
        error: err
      })
    }
    if (user.resetToken && user.resetToken === req.body.token.toString()) {
      return res.status(403).send({
        success: false,
        error: "This token has already been user"
      })
    }
    user.password = Bcrypt.hashSync(req.body.password, 8)
    user.resetToken = req.body.token.toString()
    user.save((error, savedUser) => {
      if (error) {
        console.error(error)
        return res.status(400).send({
          success: false,
          error: error
        })
      }
      res.send({
        success: true,
        data: savedUser
      })
    })
  })
})


router.post('/admin', authenticateTokenAdmin, (req, res) => {
  console.log(req.body)
  User.findOne({email:req.body.email}, (err, user) => {
    if(err){
      console.error(err)
      return res.status(400).send({
        success: false,
        error: err
      })
    }
    user.isAdmin = true
    user.save((err, savedUser) => {
      if(err){
        console.error(err)
        return res.status(400).send({
          success: false,
          error: err
        })
      }
      res.send({
        success: true,
        data: savedUser
      })
    })
  })
})

router.delete('/admin', authenticateTokenAdmin, (req, res) => {
  console.log(req.query)
  User.findById(req.query.id, (err,user) => {
    if(err){
      console.error(err)
      return res.status(400).send({
        success: false,
        error: err
      })
    }
    user.isAdmin = false
    user.save((err, removedUser) => {
      if(err){
        console.error(err)
        return res.status(400).send({
          success: false,
          error: err
        })
      }
      res.send({
        success: true,
        data: removedUser
      })
    })
  })
  // res.send()
})


module.exports = router