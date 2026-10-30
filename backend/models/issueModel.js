const mongoose = require("mongoose");
const { Schema } = mongoose;

const IssueSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    tittle: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    repository: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
    },
    repositories: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

IssueSchema.pre("save", function () {
  if (this.title && !this.tittle) this.tittle = this.title;
  if (this.tittle && !this.title) this.title = this.tittle;
  if (this.repository && !this.repositories) this.repositories = this.repository;
  if (this.repositories && !this.repository) this.repository = this.repositories;
});

const Issue = mongoose.model("Issue", IssueSchema);

module.exports = Issue;
