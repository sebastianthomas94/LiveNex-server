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
  const {
    title,
    startTime,
    destinations,
    broadcast,
    youtubeLiveUrl,
    facebookLiveUrl,
    videoUrl,
    twitchLiveUrl,
  } = req.body;
  const isFacebookPresent = destinations.includes("facebook");
  const isYoutubePresent = destinations.includes("youtube");

  User.updateOne(
    { email },
    {
      $push: {
        streams: {
          title,
          startTime,
          destinations,
          broadcast,
          ...(youtubeLiveUrl && { youtubeLiveUrl }),
          ...(facebookLiveUrl && { facebookLiveUrl }),
          ...(twitchLiveUrl && { twitchLiveUrl }),
          videoUrl,
        },
      },
    }
  )
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

const getAllTickets = (req, res) => {
  User.aggregate([{ $project: { tickets: 1, _id: 1, name: 1 } }])
    .then((result) => {
      const tickets = result.flatMap((user) => {
        if (user?.tickets?.length > 0) {
          return user.tickets.map((ticket) => ({
            _id: ticket._id,
            user: user.name,
            date: ticket.date,
            subject: ticket.subject,
            description: ticket.description,
            status: ticket.status,
            reply: ticket.reply,
          }));
        }
        return [];
      });
      res.status(200).json(tickets);
    })
    .catch((e) => console.log("error when geting tickets: ", e.message));
};

const saveTicketReply = (req, res) => {
  const { _id, status, reply } = req.body;
  User.findOneAndUpdate(
    {
      tickets: {
        $elemMatch: { _id: _id },
      },
    },
    {
      $set: { "tickets.$.status": status, "tickets.$.reply": reply },
    },
    { new: true }
  ).then((result) => {
    console.log("ticket has been resolved.");
    res.status(200).json({ data: "ticket has been resolved." });
  });
};
export {
  adminLogin,
  getUsers,
  setLiveData,
  getPastLives,
  deleteUser,
  getAllTickets,
  saveTicketReply,
};
