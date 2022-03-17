const express = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

require("./suny.js")(app);
require("./ashraful.js")(app);
require("./nizam.js")(app);

app.get("/", (req, res) => {
  res.send("EDU BUDDIES is Running");
});

app.listen(port, () => {
  console.log("EDU BUDDIES Server is running at port", port);
});
