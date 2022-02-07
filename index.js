const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// for locally uses
// DB_USER=edubuddies
// DB_PASS=8DaiWFXP17JXsiB9

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
    const database = client.db("edubuddies");
    const courses = database.collection("courses");
    console.log("DB Connected");

    // post single Course
    app.post("/courses", async (req, res) => {
      const newItem = req.body;
      const result = await courses.insertOne(newItem);
      res.json(result);
    });

    // get all the course List

    app.get("/courses", async (req, res) => {
      const coursesList = courses.find({});
      const allCoursesList = await coursesList.toArray();
      res.send(allCoursesList);
    });

    //end of the code
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("EDU Buddy is Running");
});

app.listen(port, () => {
  console.log("Server is running at port", port);
});
