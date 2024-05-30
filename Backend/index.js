const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const port = 4000 || process.env.PORT;
const { Parser } = require('json2csv');
const dotenv = require('dotenv');
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.redirect("https://form0018.netlify.app/");
});


const url = process.env.MONGO_URL;
mongoose.connect(url)
    .then(() => {
        console.log("Connected to MongoDB successfully!");
    })
    .catch((err) => {
        console.log(`An error occurred while connecting: ${err}`);
    });

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    dob: {
        type: Date,
        required: true
    },
    state: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', schema);

app.get('/users', (req, res) => {
    User.find({})
        .then(users => res.json(users))
        .catch(err => res.status(500).json({ message: err.message }));
});

app.post('/submit', (req, res) => {
    const { name, email, dob, state } = req.body;
    const user = new User({ name, email, dob, state });

    user.save()
        .then(newUser => res.status(201).json({ message: 'Successfully submitted!', user: newUser }))
        .catch(err => res.status(400).json({ message: err.message }));
});


app.get(`/${process.env.SECRETKEY}`, async (req, res) => {
    try {
        const users = await User.find({});
        const fields = ['name', 'email', 'dob', 'state'];
        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(users);

        res.header('Content-Type', 'text/csv');
        res.attachment('users.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
