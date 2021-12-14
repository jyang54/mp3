/*
 * Connect all of your endpoints together here.
 */
var User = require("../models/user");
module.exports = function (app, router) {
  app.use("/api", require("./home.js")(router));
  app.use("/api/users", require("./users.js"));
  app.use("/api/tasks", require("./tasks.js"));
  // app.post("/api/users", (req, res) => {
  //   var myData = new User(req.body);
  //   myData
  //     .save()
  //     .then((item) => {
  //       res.send(req.body);
  //     })
  //     .catch((err) => {
  //       res.status(400).send("unable to save to database");
  //     });
  // });
};
