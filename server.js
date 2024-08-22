const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

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

// Function to calculate and save averages into CSV files
async function calculateAndSaveAverages() {
  try {
    const result = await Activity.aggregate([
      {
        $group: {
          _id: "$sessionId",
          averageDangerLevel: { $avg: "$dangerLevel" },
          averageMovement: { $avg: "$movement" },
        },
      },
    ]);

    if (result.length > 0) {
      // Prepare data for CSV files
      const dangerLevelData = result.map((session) => ({
        sessionId: session._id,
        averageDangerLevel: session.averageDangerLevel,
      }));

      const movementData = result.map((session) => ({
        sessionId: session._id,
        averageMovement: session.averageMovement,
      }));

      // CSV Writers
      const dangerLevelCsvWriter = createCsvWriter({
        path: "danger_level_averages.csv",
        header: [
          { id: "sessionId", title: "Session ID" },
          { id: "averageDangerLevel", title: "Average Danger Level" },
        ],
      });

      const movementCsvWriter = createCsvWriter({
        path: "movement_averages.csv",
        header: [
          { id: "sessionId", title: "Session ID" },
          { id: "averageMovement", title: "Average Movement" },
        ],
      });

      // Write to CSV files
      await dangerLevelCsvWriter.writeRecords(dangerLevelData);
      await movementCsvWriter.writeRecords(movementData);

      console.log(
        "CSV files for danger level and movement averages have been created successfully."
      );
    } else {
      console.log("No records found.");
    }
  } catch (error) {
    console.error("Error calculating averages:", error);
    throw error;
  }
}

// Endpoint to trigger CSV generation
app.get("/generate-averages-csv", async (req, res) => {
  try {
    await calculateAndSaveAverages();
    res
      .status(200)
      .json({ message: "CSV files with averages generated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error generating CSV files.", error });
  }
});

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
