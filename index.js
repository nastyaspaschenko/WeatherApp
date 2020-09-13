const express = require('express');
const bodyParser = require('body-parser');
const app = express();

let MongoClient = require('mongodb').MongoClient;
let ObjectID = require('mongodb').ObjectID;

const url = 'mongodb://127.0.0.1:27017';//'mongodb://localhost:27017';
const dbName = 'weatherapp';
const client = new MongoClient(url);

let db;

client.connect((err) => {
    if(err) return console.log(err);
    db = client.db(dbName);
    app.listen(3000);
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'), 
    (err) => console.log(err));

app.post('/', (req, res) => {
    let user = {
        name: 'user'
    }
    db.collection('users').insertOne(user, (err, result) => {
        if(err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.status(200).json(user);
    });
});

app.get('/cities', (req, res) => {
    db.collection('cities').find({user_id: req.query.userid}).toArray((err, docs) => {
        if(err) {
            console.log(err);
            return res.sendStatus(500);
        }        
        res.status(200).json(docs);
    });
});

app.post('/cities', (req, res) => {
    let city = {
        name: req.body.city,
        user_id: req.body.user_id
    }

    db.collection('cities').insertOne(city, (err, result) => {
        if(err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.status(200).json(city);
    });
});

app.delete('/cities/:id', (req, res) => {
    db.collection('cities').deleteOne({_id: ObjectID(req.params.id), user_id: req.query.userid}, (err, result) => {
        if(err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.sendStatus(200);
    });
});

app.put('/cities/:id', (req, res) => {
    db.collection('cities').updateOne({_id: ObjectID(req.params.id), user_id: req.query.userid}, 
    {$set: {name: req.body.city}}, (err, result) => {
        if(err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.sendStatus(200);
    });
});