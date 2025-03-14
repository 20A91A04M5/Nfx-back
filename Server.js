
const express = require("express");
const multer=require("multer")
const cors = require("cors");
const mysql = require('mysql2');
const dotenv = require("dotenv");
const path= require("path");
const fs = require("fs");
const {weeklyData}=require("./DataGym")
dotenv.config();

const app = express();
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure 'medias' directory exists
const uploadDir = path.join(__dirname, "medias");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Keep the file extension
    }
});

const upload = multer({ storage: storage });

// API Route for Uploading Video or Image
app.post('/vid', upload.array("files", 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    res.json({
        message: "Files uploaded successfully",
        files: req.files.map(file => ({
            filename: file.filename,
            path: `/medias/${file.filename}`
        }))
    });
});

// Serve Uploaded Files
app.use("/medias", express.static(uploadDir));



app.get("/", (req, res) => {
    res.json({ message: "Hello from Backend!" });
});


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Suhash@123',
    database: 'nfx'
});


db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});


app.post('/signup', (req, res) => {
    console.log(req.body)
    const { FirstName, LastName, Email, PhoneNo, Password } = req.body;

    if (!FirstName || !LastName || !Email || !PhoneNo || !Password) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const query = 'INSERT INTO signup (FirstName, LastName, Email, PhoneNo, Password) VALUES (?, ?, ?, ?, ?)';
    db.execute(query, [FirstName, LastName, Email, PhoneNo, Password], (err, results) => {
        if (err) {
            console.error('Error inserting data into the database:', err);
            return res.status(500).send('Error inserting data into the database');
        }
        res.status(200).send('Data inserted successfully');
    });
});


// app.post("/login", (req, res) => {
//     const { email, password } = req.body;
  
//     // Check if both email and password are provided
//     if (!email || !password) {
//       return res.status(400).json({ error: "Email and password are required." });
//     }
  
//     // Verify credentials against the signup table
//     db.query(
//       "SELECT * FROM signup WHERE Email = ? AND Password = ?",
//       [email, password],
//       (err, results) => {
//         if (err) {
//           console.error("Error querying signup table:", err);
//           return res.status(500).json({ error: "Database error." });
//         }
  
//         // If no matching user found, return an error
//         if (results.length === 0) {
//           return res.status(400).json({ error: "Invalid credentials or user does not exist." });
//         }
  
//         // Credentials are valid, so store login details in the login table
//         db.query(
//           "INSERT INTO login (Email, Password) VALUES (?, ?)",
//           [email, password],
//           (err, insertResult) => {
//             if (err) {
//               console.error("Error inserting into login table:", err);
//               return res.status(500).json({ error: "Database error." });
//             }
  
//             return res.status(200).json({ message: "Login successful." });
//           }
//         );
//       }
//     );
// });




// /login endpoint
app.post("/login", (req, res) => {
    const { email, password } = req.body;
  
    // Validate that email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Email and Password are required." });
    }
  
    // 1. Verify the user exists in the signup table
    db.query(
      "SELECT * FROM signup WHERE Email = ? AND Password = ?",
      [email, password],
      (err, signupResults) => {
        if (err) {
          console.error("Signup check error:", err);
          return res.status(500).json({ message: "Database error during signup check." });
        }
        
        if (signupResults.length === 0) {
          // No matching signup record found
          return res.status(400).json({ message: "Invalid credentials or user not registered." });
        }
  
        // 2. Check if the user already exists in the login table
        db.query(
          "SELECT * FROM login WHERE Email = ?",
          [email],
          (err, loginResults) => {
            if (err) {
              console.error("Login check error:", err);
              return res.status(500).json({ message: "Database error during login check." });
            }
  
            if (loginResults.length > 0) {
              // User already logged in before. Validate that the password matches.
              const loginUser = loginResults[0];
              if (loginUser.Password === password) {
                // Credentials match; login successful
                return res.status(200).json({ message: "Login successful.", user: loginUser });
              } else {
                // This branch should rarely be reached because the signup check passed.
                return res.status(400).json({ message: "Invalid credentials." });
              }
            } else {
              // User not present in the login table; insert a new record
              db.query(
                "INSERT INTO login (Email, Password) VALUES (?, ?)",
                [email, password],
                (err, insertResult) => {
                  if (err) {
                    console.error("Error inserting login record:", err);
                    return res.status(500).json({ message: "Database error during login insertion." });
                  }
  
                  // Construct a user object with the newly inserted login ID
                  const user = { idloginin: insertResult.insertId, Email: email, Password: password };
                  return res.status(200).json({ message: "Login successful.", user });
                }
              );
            }
          }
        );
      }
    );
  });



app.post("/exeapi",(req,res)=>{
    res.send(JSON.stringify(req.body))
    res.end()
})

// API for weekly data
app.get("/week", (req, res) => {
    res.json(weeklyData);
});





// Example POST API to receive data from frontend
// app.post("/signup", (req, res) => {
//     const { FirstName,LastName,Email,PhoneNo,Password } = req.body;    
//     if (!FirstName || !LastName || !Email || !PhoneNo || !Password) {
//         return res.status(400).json({ error: "Missing fields" });
//     }

//     console.log("Received Data:", req.body);
//     res.json({ success: true, message: `Received data for ${Email,Password}` });
// });



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




