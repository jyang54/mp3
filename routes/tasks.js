var secrets = require("../config/secrets");
var Task = require("../models/task");
var User = require("../models/user");
const express = require("express");
var mongoose = require("mongoose");

const router = express.Router();
router.get("/", function (req, res) {
  const { where, sort, limit, skip, select, count } = req.query;
  let promise = Task.find(where ? JSON.parse(where) : {});
  promise = promise.sort(sort ? JSON.parse(sort) : {});
  promise = promise.select(select ? JSON.parse(select) : {});
  // if (req.query.where) {
  //   promise = User.find(JSON.parse(req.query.where));
  // }
  // if (req.query.sort) {
  //   promise = promise.sort(JSON.parse(req.query.sort));
  // }
  if (limit) {
    promise = promise.limit(parseInt(limit));
  }
  if (skip) {
    promise = promise.skip(parseInt(skip));
  }
  promise
    .exec()
    .then((docs) => {
      if (count === "true") {
        res.status(200).json({ message: "Count of tasks", data: docs.length });
        return;
      }
      if (docs.length > 0) {
        res
          .status(200)
          .json({ message: "Tasks sucessfully found", data: docs });
      } else {
        res.status(404).json({ message: "Tasks not found", data: docs });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Server error", data: err });
    });
});

router.post("/", function (req, res) {
  var myData = new Task(req.body);
  let promise = Promise.resolve(null);
  let updateFlag = true;
  const userID = myData.assignedUser;
  const userName = myData.assignedUserName;
  if (!mongoose.isValidObjectId(userID)) {
    myData.assignedUser = "";
    myData.assignedUserName = "unassigned";
    updateFlag = false;
  } else {
    promise = User.findById(userID).exec();
  }

  promise
    .then((user) => {
      if (!user) {
        myData.assignedUser = "";
        myData.assignedUserName = "unassigned";
        updateFlag = false;
      } else if (user.name != userName) {
        if (userName === "unassigned") {
          myData.assignedUserName = user.name;
        } else {
          res.status(404).json({
            message:
              "The assigned user name does not match the assigned user ID.",
            data: null,
          });
          return { then: function () {} };
        }
      }
    })
    .then(() => myData.save())
    .then(() => {
      if (updateFlag && myData.completed === false) {
        User.findOneAndUpdate(
          { _id: myData.assignedUser },
          { $addToSet: { pendingTasks: myData._id.toString() } }
        );
      }
    })
    .then(() =>
      res
        .status(201)
        .json({ message: "Task successfully inserted", data: myData })
    )
    .catch((err) => {
      res.status(500).json({ message: "Server error", data: err });
    });

  // Promise.resolve()
  //   .then(() => {
  //     if (!mongoose.isValidObjectId(myData.assignedUser)) {
  //       console.log("It's not a valid id");
  //       myData.assignedUser = "";
  //       myData.assignedUserName = "unassigned";
  //       return null;
  //     } else {
  //       return User.findById(myData.assignedUser);
  //     }
  //   })
  //   .then((user) => {
  //     if (!user) {
  //       myData.assignedUser = "";
  //       myData.assignedUserName = "unassigned";
  //     } else if (myData.assignedUserName === "unassigned") {
  //       myData.assignedUserName = user.name;
  //     } else if (user.name !== myData.assignedUserName) {
  //       console.log(`ID is ${myData.assignedUser}`);
  //       console.log(`User.name is ${user.name}`);
  //       console.log(`MyData.assignedUserName is ${myData.assignedUserName}`);
  //       res.status(404).json({
  //         message:
  //           "The assigned user name does not match the assigned user ID.",
  //         data: null,
  //       });
  //       return false;
  //     }
  //     return true;
  //   })
  //   .then((flag) => {
  //     if (!flag) return;
  //     if (!mongoose.isValidObjectId(myData.assignedUser))
  //       return myData.save().then(() => {
  //         res
  //           .status(201)
  //           .json({ message: "Task successfully inserted", data: myData });
  //       });
  //     User.findOneAndUpdate(
  //       { _id: myData.assignedUser },
  //       { $push: { pendingTasks: myData._id.toString() } }
  //     )
  //       .then((doc) => {
  //         return myData.save();
  //       })
  //       .then(() => {
  //         res
  //           .status(201)
  //           .json({ message: "Task successfully inserted", data: myData });
  //       });
  //   })
  //   .catch((err) => {
  //     res.status(500).json({ message: "Server error", data: err });
  //   });

  // myData
  //   .save()
  //   .then(() => {
  //     if (
  //       mongoose.isValidObjectId(myData.assignedUser) &&
  //       myData.completed === false
  //     ) {
  //       User.findOneAndUpdate(
  //         { _id: myData.assignedUser },
  //         { $addToSet: { pendingTasks: myData._id.toString() } }
  //       );
  //     }
  //   })
  //   .then(() =>
  //     res
  //       .status(201)
  //       .json({ message: "Task successfully inserted", data: myData })
  //   )
  //   .catch((err) => {
  //     res.status(500).json({ message: "Server error", data: err });
  //   });

  // if (mongoose.isValidObjectId(myData.assignedUser)) {
  //   User.findOneAndUpdate(
  //     { _id: myData.assignedUser },
  //     { $addToSet: { pendingTasks: myData._id.toString() } }
  //   )
  //     .then((doc) => {
  //       return myData.save();
  //     })
  //     .then(() => {
  //       res
  //         .status(201)
  //         .json({ message: "Task successfully inserted", data: myData });
  //     })
  //     .catch((err) => {
  //       res.status(500).json({ message: "Server error", data: err });
  //     });
  // } else {
  //   myData
  //     .save()
  //     .then(() => {
  //       res
  //         .status(201)
  //         .json({ message: "Task successfully inserted", data: myData });
  //     })
  //     .catch((err) => {
  //       res.status(500).json({ message: "Server error", data: err });
  //     });
  // }
});

// tasks/:id
router.get("/:id", function (req, res) {
  const id = req.params.id;
  Task.findById(id)
    .exec()
    .then((doc) => {
      //console.log("From database", doc);
      if (doc) {
        res
          .status(200)
          .json({ message: `Task ${id} successfully found`, data: doc });
      } else {
        res.status(404).json({
          message: `No valid task found for provided ID ${id}`,
          data: doc,
        });
      }
    })
    .catch((err) => {
      //console.log(err);
      res.status(500).json({ message: "Server error", data: err });
    });
});

router.put("/:id", function (req, res) {
  const id = req.params.id;
  const { completed } = req.body;
  Task.findOneAndUpdate({ _id: id }, req.body)
    .then((doc) => {
      if (!doc) {
        res.status(404).json({
          message: `No valid task found for provided ID ${id}`,
          data: doc,
        });
        return;
      }
      if (completed === true) {
        User.findOneAndUpdate(
          { _id: doc.assignedUser },
          { $pull: { pendingTasks: doc._id } }
        ).then((item) => {
          res
            .status(200)
            .json({ message: `Task ${id} successffully updated`, data: doc });
        });
      }
    })
    .catch((err) =>
      res.status(500).json({ message: "Server Error", data: err })
    );
});

router.delete("/:id", function (req, res) {
  const id = req.params.id;
  Task.findOneAndDelete({ _id: id })
    .exec()
    .then((doc) => {
      if (!doc) {
        res.status(404).json({
          message: `No valid task found for provided ID ${id}`,
          data: doc,
        });
        return;
      }
      if (!mongoose.isValidObjectId(doc.assignedUser)) {
        return res
          .status(200)
          .json({ message: `Task ${id} successfully deleted`, data: doc });
      }
      User.findOneAndUpdate(
        { _id: doc.assignedUser },
        { $pull: { pendingTasks: doc._id } }
      ).then((item) => {
        return res
          .status(200)
          .json({ message: `Task ${id} successfully deleted`, data: doc });
      });
    })
    .catch((err) => {
      //console.log(err);
      res.status(500).json({ message: "Server error", data: err });
    });
});

module.exports = router;
