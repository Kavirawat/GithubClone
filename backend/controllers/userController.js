const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const url = process.env.MONGODB_URL;

let client;

async function connectClient() {
  if (!client) {
    client = new MongoClient(url);
    await client.connect();
  }
}

const SignUp = async (req, res) => {
  const { username, password, email } = req.body;

  try {
    await connectClient();
    const db = client.db("apnaGithub");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "User is already exists!" });
    }

    const salt = await bcrypt.genSalt(10);
    const handlePassword = await bcrypt.hash(password, salt);

    const newUser = {
      username,
      password: handlePassword,
      email,
      bio: "",
      avatarUrl: "",
      repositories: [],
      followedusers: [],
      starRepos: [],
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    const token = jwt.sign(
      { id: result.insertedId },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1h",
      },
    );

    res.json({ token, userId: result.insertedId });
  } catch (err) {
    console.error("Error during the signup :", err.message);
    res.status(500).send("Server error");
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    await connectClient();
    const db = client.db("apnaGithub");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credential!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credential!" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ token, userId: user._id, username: user.username });
  } catch (err) {
    console.error("Error during the login : ", err.message);
    res.status(500).send("Server error");
  }
};

const getAllUsers = async (req, res) => {
  try {
    await connectClient();
    const db = client.db("apnaGithub");
    const usersCollection = db.collection("users");

    const users = await usersCollection.find({}, { projection: { password: 0 } }).toArray();
    res.json(users);
  } catch (err) {
    console.error("Error during the fetching : ", err.message);
    res.status(500).send("Server error");
  }
};

const getUserProfile = async (req, res) => {
  const currentId = req.params.id;

  try {
    await connectClient();
    const db = client.db("apnaGithub");
    const usersCollection = db.collection("users");

    let query;
    if (ObjectId.isValid(currentId)) {
      query = { _id: new ObjectId(currentId) };
    } else {
      query = { username: currentId };
    }

    const user = await usersCollection.findOne(query, {
      projection: { password: 0 },
    });

    if (!user) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    res.send(user);
  } catch (err) {
    console.error("Error during the fetching : ", err.message);
    res.status(500).send("Server error");
  }
};

const updateUserProfile = async (req, res) => {
  const currentId = req.params.id;
  const { email, password, bio, username, avatarUrl, location } = req.body;

  try {
    await connectClient();
    const db = client.db("apnaGithub");
    const usersCollection = db.collection("users");

    let updatedField = {};
    if (email) updatedField.email = email;
    if (bio !== undefined) updatedField.bio = bio;
    if (username) updatedField.username = username;
    if (avatarUrl) updatedField.avatarUrl = avatarUrl;
    if (location) updatedField.location = location;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const handlePassword = await bcrypt.hash(password, salt);
      updatedField.password = handlePassword;
    }

    let query;
    if (ObjectId.isValid(currentId)) {
      query = { _id: new ObjectId(currentId) };
    } else {
      query = { username: currentId };
    }

    const result = await usersCollection.findOneAndUpdate(
      query,
      { $set: updatedField },
      { returnDocument: "after" },
    );

    const doc = result && result.value ? result.value : result;
    if (!doc) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    res.json(doc);
  } catch (err) {
    console.error("Error during the updating : ", err.message);
    res.status(500).send("Server error");
  }
};

const deleteUserProfile = async (req, res) => {
  const currentId = req.params.id;

  try {
    await connectClient();
    const db = client.db("apnaGithub");
    const usersCollection = db.collection("users");

    let query;
    if (ObjectId.isValid(currentId)) {
      query = { _id: new ObjectId(currentId) };
    } else {
      query = { username: currentId };
    }

    const result = await usersCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    res.send({ message: "User Profile Deleted!" });
  } catch (err) {
    console.error("Error during the deleting : ", err.message);
    res.status(500).send("Server error");
  }
};

module.exports = {
  SignUp,
  getAllUsers,
  login,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
};
