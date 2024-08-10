const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();
const MONGODB_URI = process.env.MONGODB_URI;

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());

mongoose
  .connect(MONGODB_URI, {})
  .then(() => console.log("Connected to the database"))
  .catch((error) => console.log(error));

const activitySchema = new mongoose.Schema({
  userId: String,
  sessionId: String,
  startTime: String,
  userEngagement: Number,
  backgroundMusic: Number,
  callStatus: Number,
  movement: Number,
  soundLevel: Number,
  dangerLevel: Number,
});

const Activity = mongoose.model("Activity", activitySchema);

async function getAverageDangerLevel(sessionId) {
  try {
    const result = await Activity.aggregate([
      {
        $match: { sessionId: sessionId },
      },
      {
        $group: {
          _id: "$sessionId",
          averageDangerLevel: { $avg: "$dangerLevel" },
        },
      },
    ]);

    if (result.length > 0) {
      return result[0].averageDangerLevel;
    } else {
      return null; // No records found for this session
    }
  } catch (error) {
    console.error("Error calculating average danger level:", error);
    throw error;
  }
}

app.post("/activities", async (req, res) => {
  try {
    const activity = new Activity(req.body);
    await activity.save();
    res.status(201).send(activity);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
