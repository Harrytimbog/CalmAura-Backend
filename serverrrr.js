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

// Function to save all data into a CSV file
async function saveAllDataToCSV() {
  try {
    const allData = await Activity.find({}).lean(); // Fetch all data from the database

    if (allData.length > 0) {
      // CSV Writer
      const csvWriter = createCsvWriter({
        path: "peripheral_activity_data.csv",
        header: [
          { id: "_id", title: "ID" },
          { id: "userId", title: "User ID" },
          { id: "sessionId", title: "Session ID" },
          { id: "startTime", title: "Start Time" },
          { id: "userEngagement", title: "User Engagement" },
          { id: "backgroundMusic", title: "Background Music" },
          { id: "callStatus", title: "Call Status" },
          { id: "movement", title: "Movement" },
          { id: "soundLevel", title: "Sound Level" },
          { id: "dangerLevel", title: "Danger Level" },
        ],
      });

      // Write to CSV file
      await csvWriter.writeRecords(allData);

      console.log(
        "CSV file with all activity data has been created successfully."
      );
    } else {
      console.log("No records found.");
    }
  } catch (error) {
    console.error("Error exporting all data to CSV:", error);
    throw error;
  }
}

// Function to save movement data into a CSV file
async function saveMovementDataToCSV() {
  try {
    const movementData = await Activity.find(
      {},
      { movement: 1, _id: 0 }
    ).lean(); // Fetch only movement data

    if (movementData.length > 0) {
      // CSV Writer
      const csvWriter = createCsvWriter({
        path: "movement_data.csv",
        header: [{ id: "movement", title: "Movement" }],
      });

      // Write to CSV file
      await csvWriter.writeRecords(movementData);

      console.log("CSV file with movement data has been created successfully.");
    } else {
      console.log("No movement records found.");
    }
  } catch (error) {
    console.error("Error exporting movement data to CSV:", error);
    throw error;
  }
}

// Endpoint to trigger CSV generation for all data
app.get("/generate-all-data-csv", async (req, res) => {
  try {
    await saveAllDataToCSV();
    res
      .status(200)
      .json({ message: "CSV file with all data generated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error generating CSV file.", error });
  }
});

// Endpoint to trigger CSV generation for movement data
app.get("/generate-movement-data-csv", async (req, res) => {
  try {
    await saveMovementDataToCSV();
    res
      .status(200)
      .json({ message: "CSV file with movement data generated successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error generating movement CSV file.", error });
  }
});

// Endpoint to save new activity data
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
