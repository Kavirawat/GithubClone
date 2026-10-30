const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

const { initRepo } = require("./controllers/init");
const { addRepo } = require("./controllers/add");
const { commitRepo } = require("./controllers/commit");
const { pushRepo } = require("./controllers/push");
const { pullRepo } = require("./controllers/pull");
const { revertRepo } = require("./controllers/revert");
const {mainRouter} = require("./routes/main.router");

dotenv.config();

yargs(hideBin(process.argv))
  .command("start", "start new server", {}, startServer)
  .command("init", "initialise a new repository", {}, initRepo)
  .command(
    "add <file>",
    "Add a files to the repository",
    (yargs) => {
      yargs.positional("file", {
        description: "File to add to the staging area",
        type: "string",
      });
    },
    (argv) => {
      addRepo(argv.file);
    },
  )
  .command(
    "commit <message>",
    "Commit the staged files",
    (yargs) => {
      yargs.positional("message", {
        description: "commit message",
        type: "string",
      });
    },
    (argv) => {
      commitRepo(argv.message);
    },
  )
  .command("push", "Push commits to S3", {}, pushRepo)
  .command("pull", "Pull commits from S3", {}, pullRepo)
  .command(
    "revert <commitId>",
    "Revert to a specific commit",
    (yargs) => {
      yargs.positional("commitId", {
        description: "Commit Id to revert to ",
        type: "string",
      });
    },
    revertRepo,
  )
  .demandCommand(1, "You need at least one command")
  .help().argv;

function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(bodyParser.json());
  app.use(express.json());

  const mongoUrl = process.env.MONGODB_URL;
  mongoose
    .connect(mongoUrl)
    .then(() => console.log("MongoDb is connected!"))
    .catch((err) => console.error("unable to connect :", err));

  app.use(cors({ origin: "*" }));

  app.use("/", mainRouter);

  let user = "test";
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinRoom", (userId) => {
      user = userId;
      console.log("============");
      console.log(user);
      console.log("============");

      socket.join(userId);
    });
  });

  let db = mongoose.connection;
  db.once("open", async () => {
    console.log("CRUD operations called!");

    //CRUD operation
  });

  httpServer.listen(port, () => {
    console.log(`Server is running on PORT : ${port}`);
  });
}
