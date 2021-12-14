var secrets = require("../config/secrets");
var User = require("../models/user");
var Task = require("../models/task");
const express = require("express");
var mongoose = require("mongoose");

const router = express.Router();
router.get("/", function (req, res) {
  const { where, sort, limit, skip, select, count } = req.query;
  let promise = User.find(where ? JSON.parse(where) : {});
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
        res.status(200).json({ message: "Count of users", data: docs.length });
        return;
      }
      if (docs.length > 0) {
        res
          .status(200)
          .json({ message: "Users sucessfully found", data: docs });
      } else {
        res.status(404).json({ message: "Users not found", data: docs });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Server error", data: err });
    });
});

router.post("/", function (req, res) {
  let myData = new User(req.body);
  let newPendingTasks = [];
  Promise.resolve()
    .then(() => {
      myData.pendingTasks.forEach((task) => {
        if (mongoose.isValidObjectId(task) && Task.findById(task)) {
          newPendingTasks.push(task);
        }
      });
    })
    .then(() => {
      myData.pendingTasks = newPendingTasks;
    })
    .then(() => myData.save())
    .then(() => {
      res
        .status(201)
        .send({ message: "User successfully inserted", data: myData });
    })
    .catch((err) => {
      res
        .status(404)
        .json({ message: "Unable to save the user to database", data: err });
    });
});

// users/:id
router.get("/:id", function (req, res) {
  const id = req.params.id;
  User.findById(id)
    .exec()
    .then((doc) => {
      if (doc) {
        res
          .status(200)
          .json({ message: `User ${id} successfully found`, data: doc });
      } else {
        res.status(404).json({
          message: `No valid user found for provided ID ${id}`,
          data: doc,
        });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Server error", data: err });
    });
});

router.put("/:id", function (req, res) {
  const id = req.params.id;
  let foundUser = null;
  Promise.resolve()
    .then(() => {
      if (req.body.pendingTasks) {
        //console.log(`Start filtering pendingTasks ${req.body.pendingTasks[0]}`);
        const promises = [];
        for (let i = 0; i < req.body.pendingTasks.length; i++) {
          const task = req.body.pendingTasks[i];
          if (mongoose.isValidObjectId(task)) {
            promises.push(
              Task.findOneAndUpdate({ _id: task }, { assignedUser: id }).exec()
            );
          }
        }
        Promise.all(promises);
      }
    })
    .then(() => {
      return User.findOneAndUpdate({ _id: id }, req.body).exec();
    })
    .then((doc) => {
      if (!doc) {
        res.status(404).json({
          message: `No valid user found for provided ID ${id}`,
          data: doc,
        });
        return { then: function () {} };
      } else if (req.body.name) {
        foundUser = doc;
        return Task.updateMany(
          { assignedUser: id },
          { assignedUserName: req.body.name }
        );
      }
    })
    .then(() => {
      if (req.body._id) {
        return Task.updateMany(
          { assignedUser: id },
          { assignedUser: req.body._id }
        );
      }
    })
    .then(() =>
      res
        .status(200)
        .json({ message: `User ${id} successffully updated`, data: foundUser })
    )
    .catch((err) =>
      res.status(500).json({ message: "Server error", data: err })
    );
});

router.delete("/:id", function (req, res) {
  const id = req.params.id;
  User.findOneAndDelete({ _id: id })
    .exec()
    .then((doc) => {
      if (!doc) {
        res.status(404).json({
          message: `No valid user found for provided ID ${id}`,
          data: doc,
        });
        return;
      }
      Task.updateMany(
        { assignedUser: id },
        { assignedUser: "", assignedUserName: "unassigned" }
      ).then((item) => {
        res
          .status(200)
          .json({ message: `User ${id} successfully deleted`, data: doc });
      });
    })
    .catch((err) =>
      res.status(500).json({ message: "Server error", data: err })
    );
});

module.exports = router;
