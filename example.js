import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

const app = express();


app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true});
const userSchema = {
    email: String,
    password: String
}
const User = new mongoose.model("User", userSchema)


app.get('/', (req, res) => {
    res.render("home")
});

app.get('/login', (req, res) => {
    res.render("login")
});

app.get('/register', (req, res) => {
    res.render("register")
});

app.post('/register', function(req,res) {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    newUser.save(function(err){
        if (err) {
            console.log(err)
        } else {
            res.render("secrets")
        };
    });
});


app.post('/login', async (req, res) => {
    
});

// Logout application
app.get('/logout', (req, res) => {
    res.render("home")
});

app.listen(3000, ()=>{
    console.log(`Server running on port 3000`)
});