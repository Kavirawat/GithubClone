const mongoose = require("mongoose");
const Issue = require("../models/issueModel");
const Repository = require("../models/repoModel");

const createIssue = async (req, res) => {
  const { title, description, author } = req.body;
  const repoId = req.params.id || req.body.repository || req.body.repositories;

  try {
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Issue title is required!" });
    }

    if (!repoId || !mongoose.Types.ObjectId.isValid(repoId)) {
      return res.status(400).json({ message: "Valid repository ID is required!" });
    }

    const newIssue = new Issue({
      title: title.trim(),
      tittle: title.trim(),
      description: description || "",
      repository: repoId,
      repositories: repoId,
      author: author && mongoose.Types.ObjectId.isValid(author) ? author : undefined,
    });

    const savedIssue = await newIssue.save();

    // Link issue in Repository
    await Repository.findByIdAndUpdate(repoId, {
      $addToSet: { issues: savedIssue._id },
    }).catch(() => {});

    res.status(201).json({ message: "Issue created successfully!", issue: savedIssue });
  } catch (err) {
    console.error("Error creating issue:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

const updateIssueById = async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;

  try {
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found!" });
    }

    if (title) {
      issue.title = title;
      issue.tittle = title;
    }
    if (description !== undefined) {
      issue.description = description;
    }
    if (status) {
      issue.status = status;
    }

    const updatedIssue = await issue.save();
    res.status(200).json({ message: "Issue updated successfully!", issue: updatedIssue });
  } catch (err) {
    console.error("Error updating issue:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteIssueById = async (req, res) => {
  const { id } = req.params;

  try {
    const issue = await Issue.findByIdAndDelete(id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found!" });
    }

    // Remove from repository issues array
    if (issue.repository || issue.repositories) {
      const rId = issue.repository || issue.repositories;
      await Repository.findByIdAndUpdate(rId, {
        $pull: { issues: id },
      }).catch(() => {});
    }

    res.status(200).json({ message: "Issue deleted successfully!" });
  } catch (err) {
    console.error("Error deleting issue:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllIssues = async (req, res) => {
  const repoId = req.params.id || req.query.repository;

  try {
    let filter = {};
    if (repoId && mongoose.Types.ObjectId.isValid(repoId)) {
      filter = {
        $or: [{ repository: repoId }, { repositories: repoId }],
      };
    }

    const issues = await Issue.find(filter)
      .populate("author", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json({ message: "Issues retrieved successfully!", issues: issues || [] });
  } catch (err) {
    console.error("Error retrieving issues:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const getIssueById = async (req, res) => {
  const { id } = req.params;

  try {
    const issue = await Issue.findById(id)
      .populate("author", "username email")
      .populate("repository", "name");

    if (!issue) {
      return res.status(404).json({ message: "Issue not found!" });
    }
    res.status(200).json({ message: "Issue retrieved successfully!", issue });
  } catch (err) {
    console.error("Error retrieving issue:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createIssue,
  updateIssueById,
  deleteIssueById,
  getAllIssues,
  getIssueById,
};
