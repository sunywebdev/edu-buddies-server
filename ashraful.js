const { log } = require("winston");

module.exports = function (app) {
  const express = require("express");
  const { MongoClient } = require("mongodb");
  const SSLCommerzPayment = require("sslcommerz");
  const { v4: uuidv4 } = require("uuid");
  const ObjectId = require("mongodb").ObjectId;
  require("dotenv").config();
  const cors = require("cors");
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const user = process.env.DB_USER;
  const password = process.env.DB_PASS;

  const uri = `mongodb+srv://${user}:${password}@cluster0.tgh4y.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  async function run() {
    try {
      await client.connect();
      console.log("Database Connected Succesfully on Ashraful.js");
      const database = client.db("edubuddies");
      const courses = database.collection("courses");
      const userCollection = database.collection("users");
      const instructorCollection = database.collection("instuctor");
      const blogsCollection = database.collection("blogs");
      const newsletterCollection = database.collection("newsletter");
      const promoCollection = database.collection("promo");
      const paymentCollection = database.collection("payment");

      // get Single Teacher Info From DB
      app.get("/singleTeacher/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const TeacherData = await instructorCollection.findOne(query);
        res.json(TeacherData);
      });

      // get My Course Info From DB
      app.get("/CourseDetails/:courseId", async (req, res) => {
        const id = req.params.courseId;
        const query = { _id: ObjectId(id) };
        const CourseData = await courses.findOne(query);
        res.json(CourseData);
      });

      // get Best Perfomer from Teacher
      app.get("/teachersDashboard/bestPerformer", async (req, res) => {
        const bestPerformer = req.query;
        const TeacherData = await instructorCollection
          .find({
            performer: bestPerformer.performer,
          })
          .toArray();
        res.json(TeacherData);
      });

      // SSL Commerz All API Here

      // Initialize Payment

      app.post("/init", async (req, res) => {
        const productInfo = {
          currency: "BDT",
          paymentStatus: "pending",
          tran_id: uuidv4(),
          success_url: "https://fierce-caverns-90976.herokuapp.com/success",
          fail_url: "https://fierce-caverns-90976.herokuapp.com/failure",
          cancel_url: "https://fierce-caverns-90976.herokuapp.com/cancel",
          ipn_url: "https://fierce-caverns-90976.herokuapp.com/ipn",
          product_id: req.body.product_id,
          product_name: req.body.product_name,
          product_category: req.body.product_category,
          product_profile: req.body.product_profile,
          product_image: req.body.product_image,
          productDetails: req.body.product_profile,
          total_amount: req.body.total_amount,
          instructor: req.body.instructor,
          cus_name: req.body.cus_name,
          cus_email: req.body.cus_email,
          cus_add1: req.body.cus_add1,
          cus_street: req.body.cus_street,
          cus_city: "N/A",
          cus_state: req.body.cus_state,
          cus_postcode: req.body.cus_postcode,
          cus_country: req.body.cus_country,
          cus_phone: req.body.cus_phone,
          shipping_method: "Courier",
          ship_name: req.body.cus_name,
          ship_add1: req.body.cus_add1,
          ship_add2: req.body.cus_add1,
          ship_city: req.body.cus_city,
          ship_state: req.body.cus_state,
          ship_postcode: req.body.cus_postcode,
          ship_country: req.body.cus_country,
          multi_card_name: "mastercard",
          value_a: "ref001_A",
          value_b: "ref002_B",
          value_c: "ref003_C",
          value_d: "ref004_D",
        };
        console.log(productInfo);
        // Insert order info
        const result = await paymentCollection.insertOne(productInfo);

        const sslcommer = new SSLCommerzPayment(
          process.env.STORE_ID,
          process.env.STORE_PASSWORD,
          false
        );
        sslcommer.init(productInfo).then((data) => {
          const info = { ...productInfo, ...data };
          if (info.GatewayPageURL) {
            res.json(info.GatewayPageURL);
          } else {
            return res.status(400).json({
              message: "SSL session was not successful",
            });
          }
        });
      });
      //<----------- Success, Fail, Cancel And APN API Here ---------->

      app.post("/success", async (req, res) => {
        const order = await paymentCollection.updateOne(
          { tran_id: req.body.tran_id },
          {
            $set: {
              val_id: req.body.val_id,
            },
          }
        );
        res.redirect(
          `https://edu-buddies.netlify.app/success/${req.body.tran_id}`
        );
      });

      app.post("/failure", async (req, res) => {
        const order = await paymentCollection.deleteOne({
          tran_id: req.body.tran_id,
        });
        res.redirect(`https://edu-buddies.netlify.app/placeOrder`);
      });

      app.post("/cancel", async (req, res) => {
        const order = await paymentCollection.deleteOne({
          tran_id: req.body.tran_id,
        });
        res.redirect(`https://edu-buddies.netlify.app/`);
      });
      app.post("/ipn", (req, res) => {
        res.send(req.body);
      });

      //<---------- Ger Payment Complete Details -------->

      app.get("/orders/:tran_id", async (req, res) => {
        const id = req.params.tran_id;
        const order = await paymentCollection.findOne({ tran_id: id });
        res.json(order);
      });

      //<---------- Validate Transaction By User clicking Success Button -------->
      app.post("/validate", async (req, res) => {
        const order = await paymentCollection.findOne({
          tran_id: req.body.tran_id,
        });
        if (order.val_id === req.body.val_id) {
          const update = await paymentCollection.updateOne(
            { tran_id: req.body.tran_id },
            {
              $set: { paymentStatus: "Successful" },
            }
          );
          res.send(update.modifiedCount > 0);
        } else {
          res.send("Payment Not Confirmed, Discarted Order");
        }
      });
      //Get All Payment History
      app.get("/payments", async (req, res) => {
        const cursor = paymentCollection.find({});
        const users = await cursor.toArray();
        res.json(users);
      });
    } finally {
    }
  }
  run().catch(console.dir);
};
