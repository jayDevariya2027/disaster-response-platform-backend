const express = require("express");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// WebSocket events
const initializeSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};

const disasterRoutes = require("./src/routes/disasterRoutes");
const geocodeRoutes = require("./src/routes/geocodeRoutes");
const resourceRoutes = require("./src/routes/resourceRoutes");
const socialMediaRoutes = require("./src/routes/socialMediaRoutes")
const officialUpdateRoutes = require("./src/routes/officialUpdateRoutes");
const imageVerifyRoutes = require("./src/routes/imageVerifyRoutes");


// Routes
app.get("/", (req, res) => res.send("Disaster Response API is live"));
app.use("/disasters", disasterRoutes);
app.use("/geocode", geocodeRoutes);
app.use("/resources", resourceRoutes);
app.use("/social", socialMediaRoutes);
app.use("/updates", officialUpdateRoutes);
app.use("/verification", imageVerifyRoutes);


const startApp = async () => {
  const server = http.createServer(app);

  initializeSocketIO(server);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startApp();
