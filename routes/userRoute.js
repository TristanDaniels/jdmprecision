const express = require("express");
const router = express.Router();
const con = require("../lib/db_connection");
const middleware = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

router.get("/", (req, res) => {
  try {
    con.query("SELECT * FROM users", (err, result) => {
      if (err) throw err;
      res.json(result);
    });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.post("/", middleware, (req, res) => {
  const {
    fullname,
    email,
    userpassword,
    userRole,
    phonenumber,
    joinDate,
    cart,
  } = req.body;
  try {
    con.query(
      `insert into users (fullname,email,userpassword,userRole,phonenumber,joinDate,cart) values ('${fullname}', '${email}', '${userpassword}', '${userRole}', '${phonenumber}', '${joinDate}', '${cart}') `,
      (err, result) => {
        if (err) throw err;
        res.send(result);
      }
    );
  } catch (error) {
    console.log(error);
  }
});
//gets one user
router.get("/:id", middleware, (req, res) => {
  try {
    con.query(
      `SELECT * FROM users where id = ${req.params.id}`,
      (err, result) => {
        if (err) throw err;
        res.send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
//delete
router.delete("/:id", middleware, (req, res) => {
  try {
    con.query(
      `delete from users where id = ${req.params.id}`,
      (err, result) => {
        if (err) throw err;
        res.send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
//edit
router.put("/:id", middleware, (req, res) => {
  const {
    fullname,
    email,
    userpassword,
    userRole,
    phonenumber,
    joinDate,
    cart,
  } = req.body;
  try {
    con.query(
      `update users set fullname = "${fullname}",  email = "${email}", userpassword = "${userpassword}", userRole = "${userRole}", phonenumber = "${phonenumber}", joinDate = "${joinDate}", cart = "${cart}" where id = "${req.params.id}"`,
      (err, result) => {
        if (err) throw err;
        res.send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
router.patch("/", middleware, (req, res) => {
  const { fullname, email } = req.body;
  try {
    con.query(
      `select * from users where fullname = "${fullname}" and  email = "${email}"`,
      (err, result) => {
        if (err) throw err;
        res.send(result);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});
const bcrypt = require("bcryptjs");
// Register Route
// The Route where Encryption starts
router.post("/register", middleware, (req, res) => {
  try {
    let sql = "INSERT INTO users SET ?";
    //This is the body im requesting
    const { userpassword, fullname, email, joinDate, userRole, phonenumber } =
      req.body;
    // The start of hashing / encryption
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(userpassword, salt);
    //Database terms
    let user = {
      userpassword: hash,
      fullname,
      // We sending the hash value to be stored witin the table
      email,
      cart: "[]",
      joinDate,
      userRole,
      phonenumber,
    };
    //SQL Query
    //connection to database
    con.query(sql, user, (err, result) => {
      if (err) throw err;
      console.log(result);
      res.send(`User ${(user.fullname, user.email)} created successfully`);
    });
  } catch (error) {
    console.log(error);
  }
});
// Login
// The Route where Decryption happens
router.post("/login", (req, res) => {
  try {
    let sql = "SELECT * FROM users WHERE ?";
    let user = {
      email: req.body.email,
    };
    con.query(sql, user, async (err, result) => {
      if (err) throw err;
      if (result.length === 0) {
        res.send("user not found please register");
      } else {
        const isMatch = await bcrypt.compare(
          req.body.userpassword,
          result[0].userpassword
        );
        if (!isMatch) {
          res.send("password incorrect");
        } else {
          // The information the should be stored inside token
          const payload = {
            user: {
              id: result[0].id,
              fullname: result[0].fullname,
              joinDate: result[0].joinDate,
              userRole: result[0].userRole,
              phonenumber: result[0].phonenumber,
            },
          };
          // Creating a token and setting expiry date
          jwt.sign(
            payload,
            process.env.jwtSecret,
            {
              expiresIn: "365d",
            },
            (err, token) => {
              if (err) throw err;
              res.json({ token });
            }
          );
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
});
// Verify
router.get("/users/verify", (req, res) => {
  const token = req.header("x-auth-token");
  jwt.verify(token, process.env.jwtSecret, (error, decodedToken) => {
    if (error) {
      res.status(401).json({
        msg: "Unauthorized Access!",
      });
    } else {
      res.status(200);
      res.send(decodedToken);
    }
  });
});
router.get("/", middleware, (req, res) => {
  try {
    let sql = "SELECT * FROM users";
    con.query(sql, (err, result) => {
      if (err) throw err;
      res.send(result);
    });
  } catch (error) {
    console.log(error);
  }
});

router.post("/forgot-psw", (req, res) => {
  try {
    let sql = "SELECT * FROM users WHERE ?";
    let user = {
      fullname: req.body.fullname,
    };
    con.query(sql, user, (err, result) => {
      if (err) throw err;
      if (result === 0) {
        res.status(400), res.send("fullname not found");
      } else {
        // Allows me to connect to the given fullname account || Your fullname
        const transporter = nodemailer.createTransport({
          host: process.env.MAILERHOST,
          port: process.env.MAILERPORT,
          auth: {
            user: process.env.MAILERUSER,
            pass: process.env.MAILERPASS,
          },
        });

        // How the fullname should be sent out
        var mailData = {
          from: process.env.MAILERUSER,
          // Sending to the person who requested
          to: result[0].fullname,

          subject: "email Reset",
          html: `<div>
            <h3>Hi ${result[0].userpassword},</h3>
            <br>
            <h4>Click link below to reset your email</h4>

            <a href="https://user-images.githubusercontent.com/4998145/52377595-605e4400-2a33-11e9-80f1-c9f61b163c6a.png">
              Click Here to Reset email
              id = ${result[0].id}
            </a>

            <br>
            <p>For any queries feel free to contact us...</p>
            <div>
              fullname: ${process.env.MAILERUSER}
              <br>
              Tel: If needed you can add this
            <div>
          </div>`,
        };

        // Check if fullname can be sent
        // Check email and fullname given in .env file
        transporter.verify((error, success) => {
          if (error) {
            console.log(error);
          } else {
            console.log("fullname valid! ", success);
          }
        });

        transporter.sendMail(mailData, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            res.send("Please Check your fullname", result[0].id);
          }
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

// Rest email Route

router.put("reset-psw/:id", (req, res) => {
  let sql = "SELECT * FROM users WHERE ?";
  let user = {
    id: req.params.id,
  };
  con.query(sql, user, (err, result) => {
    if (err) throw err;
    if (result === 0) {
      res.status(400), res.send("User not found");
    } else {
      let newuserpassword = `UPDATE users SET ? WHERE id = ${req.params.id}`;

      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(req.body.userpassword, salt);

      const updateduserpassword = {
        userpassword: result[0].userpassword,
        fullname: result[0].fullname,
        cart: result[0].cart,
        joinDate: result[0].joinDate,
        userRole: result[0].userRole,
        phonenumber: result[0].phonenumber,

        // Only thing im changing in table
        userpassword: hash,
      };

      con.query(newuserpassword, updateduserpassword, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send("password updated please login again");
      });
    }
  });
});

module.exports = router;
