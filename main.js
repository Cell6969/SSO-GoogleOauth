import 'dotenv/config'
import express from "express";
import bodyParser from "body-parser";
import neo4j from "neo4j-driver";
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from "passport-google-oauth20";


const app =  express();
const port = 3000;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

// set upp session
app.use(session({
    secret:"keyboardlittlecat",
    resave: false,
    saveUninitialized: false
}));

// set up passport
app.use(passport.initialize());
app.use(passport.session());

// connet mongodb
// mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParse:true});

// connect neo4j
const driver = neo4j.driver(
    process.env.DB_HOST,
    neo4j.auth.basic(process.env.DB_USER,process.env.DB_PASS)
);
const neo4jSession=  driver.session({database:process.env.DB_NAME});

// Intiate google auth
// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/secrets", 
//     passReqToCallback: true
//   },
//   function(request, accessToken, refreshToken, profile, done) {
//     return done(null, profile)
//   }
// ));

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CLIENT_CALLBACK, 
    passReqToCallback: true
  },
  async (request, accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const userResult = await neo4jSession.run(
            "MATCH (u:User {email: $email}) RETURN u",
            { email }
        );

        if (userResult.records.length === 0) {
            return done(null, false, { message: "User not found" });
        }

        const user = userResult.records[0].get('u').properties;
        
        profile.email = email;
        profile.username = user.username; // Assuming 'username' is a property in your Neo4j schema
        profile.roles = user.role;

        return done(null, profile);
    } catch (error) {
        return done(error, null);
    }
  }
));

// Serialize and deserialize User
passport.serializeUser((user, done) => {
    done(null, user)
});

passport.deserializeUser((user, done) => {
    done(null, user)
});

// Get home page
app.get('/', (req, res) => {
    res.render("home")
});

app.get('/auth/google', 
    passport.authenticate("google", { scope: ['email','profile'] })
);

app.get('/auth/google/secrets', 
    passport.authenticate('google', { 
        failureRedirect: '/login',
        successRedirect: '/secrets'
    }),   
);

app.get('/secrets', (req, res) => {
    const {email, username, roles} = req.user;
    res.render("secrets", {email, username, roles})
})

app.get('/login', (req, res) => {
    res.render("login")
});

app.get('/register', (req, res) => {
    res.render("register")
});

// Logout application
app.get('/logout', (req, res) => {
    res.render("home")
});

app.listen(3000, ()=>{
    console.log(`Server running on port ${port}`)
});