import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../authContext";
import { RepoIcon, BookIcon, LockIcon } from "@primer/octicons-react";
import "./repo.css";

const CreateRepoModal = ({ onClose, onCreated }) => {
  const { currentUser, userProfile } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState(true); // true = Public, false = Private
  const [initReadme, setInitReadme] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ownerName = userProfile?.username || localStorage.getItem("username") || "owner";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a repository name");
      return;
    }

    if (!currentUser) {
      setError("You must be logged in to create a repository");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const content = initReadme ? ["README.md"] : ["index.js"];

      const res = await axios.post("http://localhost:3000/repo/create", {
        owner: currentUser,
        name: name.trim(),
        description: description.trim(),
        visibility: visibility,
        content: content,
      });

      setLoading(false);
      if (onCreated) {
        onCreated(res.data.repository);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to create repository. Name might already be taken."
      );
      setLoading(false);
    }
  };

  return (
    <div className="gh-modal-backdrop" onClick={onClose}>
      <div className="gh-modal gh-create-repo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gh-modal-header">
          <div className="gh-modal-title">
            <RepoIcon size={20} />
            <h2>Create a new repository</h2>
          </div>
          <button className="gh-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <p className="gh-modal-subtitle">
          A repository contains all project files, including the revision history.
        </p>

        {error && <div className="gh-alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="gh-create-repo-form">
          <div className="gh-repo-owner-name-row">
            <div className="gh-field-group">
              <label>Owner</label>
              <div className="gh-owner-badge">{ownerName}</div>
            </div>
            <span className="gh-slash">/</span>
            <div className="gh-field-group flex-1">
              <label htmlFor="repo-name">Repository name *</label>
              <input
                id="repo-name"
                type="text"
                placeholder="e.g. awesome-project"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="gh-field-group">
            <label htmlFor="repo-desc">Description (optional)</label>
            <input
              id="repo-desc"
              type="text"
              placeholder="Short description of your project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="gh-divider" />

          <div className="gh-visibility-group">
            <label className={`gh-visibility-card ${visibility ? "selected" : ""}`}>
              <input
                type="radio"
                name="visibility"
                checked={visibility}
                onChange={() => setVisibility(true)}
              />
              <div className="gh-visibility-info">
                <div className="gh-visibility-title">
                  <BookIcon size={18} />
                  <strong>Public</strong>
                </div>
                <span>Anyone on the internet can see this repository. You choose who can commit.</span>
              </div>
            </label>

            <label className={`gh-visibility-card ${!visibility ? "selected" : ""}`}>
              <input
                type="radio"
                name="visibility"
                checked={!visibility}
                onChange={() => setVisibility(false)}
              />
              <div className="gh-visibility-info">
                <div className="gh-visibility-title">
                  <LockIcon size={18} />
                  <strong>Private</strong>
                </div>
                <span>You choose who can see and commit to this repository.</span>
              </div>
            </label>
          </div>

          <div className="gh-divider" />

          <div className="gh-checkbox-group">
            <label className="gh-checkbox-label">
              <input
                type="checkbox"
                checked={initReadme}
                onChange={(e) => setInitReadme(e.target.checked)}
              />
              <div>
                <strong>Add a README file</strong>
                <p>This is where you can write a long description for your project.</p>
              </div>
            </label>
          </div>

          <div className="gh-modal-footer">
            <button type="button" className="gh-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="gh-btn gh-btn-primary"
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating repository..." : "Create repository"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRepoModal;
