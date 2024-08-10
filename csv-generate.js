const mongoose = require("mongoose");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

// Assuming your Activity schema is already defined
const Activity = mongoose.model("Activity"); // Adjust if you have a different import/export setup

async function calculateAndSaveAveragesForAllSessions() {
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
      // Prepare data for CSV file
      const csvWriter = createCsvWriter({
        path: `averages_all_sessions.csv`,
        header: [
          { id: "sessionId", title: "Session ID" },
          { id: "averageDangerLevel", title: "Average Danger Level" },
          { id: "averageMovement", title: "Average Movement" },
        ],
      });

      // Write to CSV file
      await csvWriter.writeRecords(result);

      console.log(
        "CSV file with averages from all sessions has been created successfully."
      );
    } else {
      console.log("No records found.");
    }
  } catch (error) {
    console.error("Error calculating averages:", error);
    throw error;
  }
}
