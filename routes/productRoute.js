const express = require("express");
const router = express.Router();
const con = require("../lib/db_connection");

router.get("/", (req, res) => {
  try {
    con.query("SELECT * FROM products", (err, result) => {
      if (err) throw err;
      res.send(result);
    });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

// Add
router.post("/", (req, res) => {
  const { title, category, description, imgURL, price, userID, quantity } =
    req.body;
  try {
    con.query(
      `INSERT INTO products (title, category, description, imgURL, price, userID, quantity) values ('${title}','${category}','${description}','${imgURL}','${price}','${userID}','${quantity}')`,
      (err, result) => {
        if (err) throw err;
        res.send(result);
      }
    );
  } catch (error) {
    console.log(error);
  }
});

// Edit
router.patch("/:id", (req, res) => {
  const { title, category, description, imgURL, price, userID, quantity } =
    req.body;
  try {
    con.query(
      `UPDATE products set title = "${title}", category = "${category}", description = "${description}", imgURL = "${imgURL}", price = "${price}", userID = "${userID}", quantity = "${quantity}" WHERE product_id = "${req.params.id}"`,
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

// Delete by id
router.delete("/products/:id", (req, res) => {
  try {
    con.query(
      `DELETE FROM products WHERE product_id=${req.params.id}`,

      (err, result) => {
        if (err) throw err;
        res.send(result);
      }
    );
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
