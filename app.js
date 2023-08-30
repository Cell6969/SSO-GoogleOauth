//jshint esversion:6
import 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import neo4j from "neo4j-driver";
import bcrypt from "bcrypt"

const app =  express();
const port = 3000;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

// connet mongodb
// mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParse:true});

// connect neo4j
const driver = neo4j.driver(
    process.env.DB_HOST,
    neo4j.auth.basic(process.env.DB_USER,process.env.DB_PASS)
);
const session =  driver.session({database:process.env.DB_NAME});

// create user schema
const User = `
    CREATE (u:User {
        email: $email,
        password: $hashPassword
    })
`;

// Get home page
app.get('/', (req, res) => {
    res.render("home")
});

app.get('/login', (req, res) => {
    res.render("login")
});

app.get('/register', (req, res) => {
    res.render("register")
});

app.post('/register',async (req, res) => {
    try {
        const email = req.body.username;
        const password = req.body.password;
        const existingUser = await session.run(
            `MATCH (u:User) WHERE u.email = $email RETURN u`,
            {email}
        );
        
        if (existingUser.records.length > 0) {
            return res.status(409).json({ message: 'User already exists'})
        }

        const hashPassword = await bcrypt.hash(password, 10);
        
        const result = await session.run(User, {email, hashPassword});

        res.render("home");
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'An error occurred during registration.'})
    }
});

app.post('/login', async (req, res) => {
    try {
        const email = req.body.username;
        const password = req.body.password;
        // Check User
        const userResult = await session.run(
            `MATCH (u:User {email: $email}) RETURN u`,
            {email}
        );

        if (userResult.records.length === 0) {
            return res.status(401).json({ message: 'User not Found'})
        };

        const user = userResult.records[0].get('u').properties;
        
        // validate password
        const passMatch = await bcrypt.compare(password, user.password);
        if (!passMatch) {
            return res.status(401).json({ message: "Invalid Password"})
        };

        res.render("secrets");
        // res.redirect('http://192.168.18.194:4002') //test redirect to neodash

    } catch (error) {
        console.error("Error during login:" ,error);
        res.status(500).json({ message: 'An error occurred during login.'})
    }
});

// Logout application
app.get('/logout', (req, res) => {
    res.render("home")
});

app.listen(3000, ()=>{
    console.log(`Server running on port 3000`)
});