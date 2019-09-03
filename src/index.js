const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const path = require('path')
const hbs = require('hbs')
const bodyParser = require('body-parser')
const User = require('./models/user')
const auth = require('./middleware/auth')
// const bcrypt = require('bcryptjs')

// Define paths for Express Config
const publicPath = path.join(__dirname, '../public');
const templatesPath = path.join(__dirname, '../templates/views');
const partialsPath = path.join(__dirname, '../templates/partials');

const app = express()
const port = process.env.PORT || 3000

const cookieParser = require('cookie-parser')
 
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

// app.use(bodyParser.urlencoded({ extended: true }))
// Setup handlebars engine and views location
app.set('view engine', 'hbs');
app.set('views', templatesPath);
hbs.registerPartials(partialsPath);

// Setting up static files for Express
app.use(express.static(publicPath));

app.get('/', auth, (req, res) => {
    // console.log("Username", req.user.name)
    res.render('index', {
        title: 'Node Starter',
        username: req.user.name
    })
})

app.get('/signin', (req, res) => {
    res.render('signin', {
        title: 'Node Starter'
    })
})

app.post('/signinuser', async (req, res) => {
    const userInfo = req.body;

    try {
        const user = await User.findByCredentials(userInfo.username, userInfo.password)
        const token = await user.generateAuthToken()
        res.cookie('auth_token', token)
        res.redirect('/')
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

app.get('/signup', (req, res) => {
    res.render('signup', {
        title: 'Node Starter'
    })
})

app.post('/signupuser', async (req, res) => {
    const userInfo = req.body;
    console.log(userInfo)
    if (userInfo.password == userInfo.confirmPassword) {
        await User.findOne({ email: userInfo.email }, (err, data) => {
            if (!data) {
                var user = new User({
                    "name": userInfo.username,
                    "email": userInfo.email,
                    "password": userInfo.password
                })
                user.save(function (err, User) {
                    if (err)
                        res.send({ "Error": "Unknown Error Occured" })
                    else
                        res.send({ "Success": "User created!" })
                });
            } else {
                res.send({ "Error": "Email is already registered!" })
            }
        })
    } else {
        res.send({ "Error": "Both passwords don't match!" });
    }
})

app.post('/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.redirect('/signin')
    } catch(e) {
        res.status(500).send()
    }
})

// app.use(express.json())
// app.use(userRouter)

// app.use((req, res, next) => {
//     if (req.method === 'GET') {
//         res.send('GET requests are disabled')
//     } else {
//         next()
//     }
// })

// app.use((req, res, next) => {
//     res.status(503).send('Site is currently down. Check back soon!')
// })

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})