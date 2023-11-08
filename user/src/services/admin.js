import User from "../models/userModel.js";

const adminLogin = (req, res) => {
  const { username, password } = req.body;
  if (username == "admin" && password == "pass") {
    console.log("login successfull!");
    res.status(200).json({ message: "login successfull!", login: true });
  } else res.status(403).json({ message: "username or password incorrect!" });
};

const getUsers = (req, res) => {
  User.find({}).then((result) => {
    res.status(200).json(result);
  });
};

const setLiveData = (req, res) => {
  const email = req.userEmail;
  console.log(email, req.body);
  User.updateOne({ email }, { $push: { streams: req.body } })
    .then((result) => console.log("past lives data added", result))
    .catch((e) => console.log(e));
};

const getPastLives = (req, res) => {
  const email = req.userEmail;
  User.aggregate([
    { $match: { email } },
    { $unwind: "$streams" },
    { $sort: { "streams.startTime": -1 } },
    {
      $group: {
        _id: "$_id",
        streams: { $push: "$streams" },
      },
    },
  ])
    .then((result) => {
      res.status(200).json(result[0].streams);
    })
    .catch((e) => console.log("error form geting past lives: ", e.message));
};

const deleteUser = (req, res) => {
  const { _id } = req.query;
  User.findOneAndDelete({ _id })
    .then((result) => {
      console.log("user has been deleted");
    })
    .catch((e) => console.log(e.message));
};

export { adminLogin, getUsers, setLiveData, getPastLives, deleteUser };
