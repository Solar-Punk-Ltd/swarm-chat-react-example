import express from "express";
import pkg from "@anythread/gsoc";
const { InformationSignal } = pkg;
import PQueue from "p-queue";
import cors from "cors";
import { Queue } from "./queue.mjs";

const app = express();
const port = 3030;

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(cors());

// Create a queue for processing jobs
const messageQueue = new Queue();
let informationSignalInstance;

function getInformationSignalInstance(url, stamp, topic) {
  if (!informationSignalInstance) {
    informationSignalInstance = new InformationSignal(url, {
      consensus: {
        id: `SwarmDecentralizedChat::${topic}`,
        assertRecord: (input) => {
          return true;
        },
      },
      postage: stamp,
    });
  }
  return informationSignalInstance;
}

async function sendMessageToGsoc(url, stamp, topic, resourceId, message) {
  try {
    if (!resourceId) throw new Error("ResourceID was not provided!");

    const informationSignal = getInformationSignalInstance(url, stamp, topic);
    const uploadedSoc = await informationSignal.write(message, resourceId);

    return uploadedSoc;
  } catch (error) {
    console.error("Error sending message to GSOC:", error);
    throw error; // Ensure errors propagate to the queue
  }
}

// POST handler
app.post("/write", (req, res) => {
  const { url, stamp, topic, resourceId, message } = req.body;

  if (!url || !stamp || !topic || !resourceId || !message) {
    return res.status(400).json({
      error: "Missing required fields: url, stamp, topic, resourceId, message",
    });
  }

  // Add the job to the queue
  messageQueue.enqueue(async () => {
    try {
      const result = await sendMessageToGsoc(
        url,
        stamp,
        topic,
        resourceId,
        message
      );
      console.log("Message successfully sent:", {
        url,
        stamp,
        topic,
        resourceId,
        message,
      });
      res.status(201).json({
        message: "Data successfully uploaded",
        result,
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to process the request",
        details: error.message,
      });
      console.error("Failed to send message:", error);
      throw error;
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
