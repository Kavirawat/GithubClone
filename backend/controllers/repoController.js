const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");

const createRepository = async (req, res) => {
  const { owner, name, issues, content, description, descriptions, visibility } = req.body;

  try {
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Repository name is required!" });
    }

    if (!owner || !mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ message: "Invalid owner ID!" });
    }

    const existingRepo = await Repository.findOne({ name: name.trim() });
    if (existingRepo) {
      return res.status(400).json({ message: "A repository with this name already exists!" });
    }

    const desc = description || descriptions || "";
    const repoIssues = issues && mongoose.Types.ObjectId.isValid(issues) ? [issues] : [];

    const newRepository = new Repository({
      owner,
      name: name.trim(),
      issues: repoIssues,
      content: content && content.length > 0 ? content : ["README.md"],
      description: desc,
      descriptions: desc,
      visibility: visibility !== undefined ? visibility : true,
    });

    const savedRepository = await newRepository.save();

    // Also link repo in User's repositories list if User exists
    await User.findByIdAndUpdate(owner, {
      $addToSet: { repositories: savedRepository._id },
    }).catch(() => {});

    res.status(201).json({
      message: "Repository created successfully!",
      repository: savedRepository,
    });
  } catch (err) {
    console.error("Error during repository creation:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

const getAllRepositories = async (req, res) => {
  try {
    const repositories = await Repository.find()
      .populate("owner", "username email")
      .populate("issues")
      .sort({ createdAt: -1 });

    res.status(200).json({ message: "Repositories fetched successfully!", repositories });
  } catch (err) {
    console.error("Error fetching repositories:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const fetchRepositoryById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid repository ID format!" });
    }

    const repository = await Repository.findById(id)
      .populate("owner", "username email")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({ message: "Repository not found!" });
    }

    res.status(200).json({ message: "Repository retrieved successfully!", repository });
  } catch (err) {
    console.error("Error fetching repository:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const fetchRepositoryByName = async (req, res) => {
  const { name } = req.params;

  try {
    const repository = await Repository.findOne({ name })
      .populate("owner", "username email")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({ message: "Repository not found!" });
    }

    res.status(200).json({ message: "Repository retrieved successfully!", repository });
  } catch (err) {
    console.error("Error fetching repository:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const fetchRepositoriesForCurrentUser = async (req, res) => {
  const userId = req.params.userId || req.user || req.query.userId;

  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const repositories = await Repository.find({ owner: userId })
      .populate("owner", "username email")
      .sort({ createdAt: -1 });

    res.json({
      message: "Repositories fetched successfully!",
      repositories: repositories || [],
    });
  } catch (err) {
    console.error("Error fetching repositories for current user:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const updateRepositoryById = async (req, res) => {
  const { id } = req.params;
  const { content, description } = req.body;

  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found!" });
    }

    if (content) {
      if (Array.isArray(content)) {
        repository.content = content;
      } else {
        repository.content.push(content);
      }
    }

    if (description !== undefined) {
      repository.description = description;
      repository.descriptions = description;
    }

    const updatedRepository = await repository.save();
    res.json({
      message: "Repository updated successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error updating repository:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const toggleVisibilityById = async (req, res) => {
  const { id } = req.params;

  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found!" });
    }
    repository.visibility = !repository.visibility;
    const updatedRepository = await repository.save();
    res.json({
      message: "Repository visibility toggled successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error toggling repository visibility:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const toggleStarRepository = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found!" });
    }

    if (!repository.stars) {
      repository.stars = [];
    }

    const index = repository.stars.findIndex((s) => s.toString() === userId);
    let starred = false;
    if (index > -1) {
      repository.stars.splice(index, 1);
      starred = false;
    } else {
      repository.stars.push(userId);
      starred = true;
    }

    await repository.save();
    res.json({
      message: starred ? "Starred repository!" : "Unstarred repository!",
      starred,
      starCount: repository.stars.length,
      repository,
    });
  } catch (err) {
    console.error("Error toggling star:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteRepositoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const repository = await Repository.findByIdAndDelete(id);
    if (!repository) {
      return res.status(404).json({ message: "Repository not found!" });
    }

    // Clean up issues related to this repository
    await Issue.deleteMany({ repository: id }).catch(() => {});

    res.json({ message: "Repository deleted successfully!" });
  } catch (err) {
    console.error("Error deleting repository:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  fetchRepositoryByName,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibilityById,
  toggleStarRepository,
  deleteRepositoryById,
};
