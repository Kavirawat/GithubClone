import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../authContext";
import Navbar from "../navbar/Navbar";
import {
  RepoIcon,
  StarIcon,
  EyeIcon,
  RepoForkedIcon,
  CodeIcon,
  IssueOpenedIcon,
  IssueClosedIcon,
  GearIcon,
  GitBranchIcon,
  FileIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  LockIcon,
  BookIcon,
  TagIcon,
} from "@primer/octicons-react";
import "./repo.css";

const RepositoryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("code"); // 'code' | 'issues' | 'settings'

  // Star state
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);

  // Issues state
  const [issues, setIssues] = useState([]);
  const [issueFilter, setIssueFilter] = useState("open"); // 'open' | 'closed' | 'all'
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueDesc, setNewIssueDesc] = useState("");
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Add File state
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [submittingFile, setSubmittingFile] = useState(false);

  // Settings state
  const [editDesc, setEditDesc] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [copiedClone, setCopiedClone] = useState(false);

  const fetchRepoData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:3000/repo/${id}`);
      const repoData = res.data.repository;
      setRepo(repoData);
      setEditDesc(repoData.description || repoData.descriptions || "");
      
      const starsArr = repoData.stars || [];
      setStarCount(starsArr.length);
      if (currentUser) {
        setIsStarred(starsArr.some((s) => (s._id || s).toString() === currentUser));
      }

      // Fetch issues for this repository
      const issuesRes = await axios.get(`http://localhost:3000/issue/all/${id}`);
      setIssues(issuesRes.data.issues || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Repository not found or could not be loaded.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepoData();
  }, [id, currentUser]);

  const handleToggleStar = async () => {
    if (!currentUser) return;
    try {
      const res = await axios.post(`http://localhost:3000/repo/star/${id}`, {
        userId: currentUser,
      });
      setIsStarred(res.data.starred);
      setStarCount(res.data.starCount);
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    if (!newIssueTitle.trim()) return;

    try {
      setSubmittingIssue(true);
      const res = await axios.post(`http://localhost:3000/issue/create/${id}`, {
        title: newIssueTitle.trim(),
        description: newIssueDesc.trim(),
        author: currentUser,
      });

      setIssues([res.data.issue, ...issues]);
      setNewIssueTitle("");
      setNewIssueDesc("");
      setShowNewIssueModal(false);
      setSubmittingIssue(false);
    } catch (err) {
      console.error("Failed to create issue:", err);
      setSubmittingIssue(false);
    }
  };

  const handleToggleIssueStatus = async (issueId, currentStatus) => {
    const nextStatus = currentStatus === "open" ? "closed" : "open";
    try {
      const res = await axios.put(`http://localhost:3000/issue/update/${issueId}`, {
        status: nextStatus,
      });
      setIssues(
        issues.map((i) => (i._id === issueId ? { ...i, status: nextStatus } : i))
      );
    } catch (err) {
      console.error("Failed to update issue status:", err);
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    try {
      await axios.delete(`http://localhost:3000/issue/delete/${issueId}`);
      setIssues(issues.filter((i) => i._id !== issueId));
    } catch (err) {
      console.error("Failed to delete issue:", err);
    }
  };

  const handleAddFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    try {
      setSubmittingFile(true);
      const updatedContent = [...(repo.content || []), newFileName.trim()];
      await axios.put(`http://localhost:3000/repo/update/${id}`, {
        content: newFileName.trim(),
      });
      setRepo({ ...repo, content: updatedContent });
      setNewFileName("");
      setShowAddFileModal(false);
      setSubmittingFile(false);
    } catch (err) {
      console.error("Failed to add file:", err);
      setSubmittingFile(false);
    }
  };

  const handleSaveDescription = async () => {
    try {
      setSavingSettings(true);
      await axios.put(`http://localhost:3000/repo/update/${id}`, {
        description: editDesc,
      });
      setRepo({ ...repo, description: editDesc, descriptions: editDesc });
      setSavingSettings(false);
      alert("Repository description updated!");
    } catch (err) {
      console.error("Failed to update repository:", err);
      setSavingSettings(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      const res = await axios.patch(`http://localhost:3000/repo/toggle/${id}`);
      setRepo({ ...repo, visibility: res.data.repository.visibility });
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
    }
  };

  const handleDeleteRepo = async () => {
    if (!window.confirm(`Are you sure you want to delete "${repo.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await axios.delete(`http://localhost:3000/repo/delete/${id}`);
      navigate("/");
    } catch (err) {
      console.error("Failed to delete repository:", err);
    }
  };

  const handleCopyClone = () => {
    const cloneUrl = `http://localhost:3000/${repo.owner?.username || "user"}/${repo.name}.git`;
    navigator.clipboard.writeText(cloneUrl);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  if (loading) {
    return (
      <div className="gh-page">
        <Navbar />
        <div className="gh-loading-container">
          <div className="gh-spinner" />
          <span>Loading repository...</span>
        </div>
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="gh-page">
        <Navbar />
        <div className="gh-error-container">
          <h2>404 Not Found</h2>
          <p>{error || "Repository does not exist."}</p>
          <Link to="/" className="gh-btn gh-btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const ownerName = repo.owner?.username || "owner";
  const openIssuesCount = issues.filter((i) => i.status === "open").length;
  const filteredIssues = issues.filter((i) => {
    if (issueFilter === "all") return true;
    return i.status === issueFilter;
  });

  const files = repo.content && repo.content.length > 0 ? repo.content : ["README.md"];

  return (
    <div className="gh-page">
      <Navbar />

      {/* Repository Header */}
      <div className="gh-repo-header">
        <div className="gh-repo-header-top">
          <div className="gh-repo-breadcrumb">
            <RepoIcon size={18} className="gh-repo-icon" />
            <Link to="/profile" className="gh-owner-link">
              {ownerName}
            </Link>
            <span className="gh-slash">/</span>
            <span className="gh-repo-title-name">{repo.name}</span>
            <span className={`gh-badge ${repo.visibility ? "public" : "private"}`}>
              {repo.visibility ? "Public" : "Private"}
            </span>
          </div>

          <div className="gh-repo-actions">
            <button className="gh-btn gh-btn-sm" title="Watch repo">
              <EyeIcon size={16} />
              <span>Watch</span>
              <span className="gh-action-count">1</span>
            </button>
            <button className="gh-btn gh-btn-sm" title="Fork repo">
              <RepoForkedIcon size={16} />
              <span>Fork</span>
              <span className="gh-action-count">0</span>
            </button>
            <button
              className={`gh-btn gh-btn-sm ${isStarred ? "gh-btn-starred" : ""}`}
              onClick={handleToggleStar}
              title={isStarred ? "Unstar repository" : "Star repository"}
            >
              <StarIcon size={16} fill={isStarred ? "#e3b341" : "currentColor"} />
              <span>{isStarred ? "Starred" : "Star"}</span>
              <span className="gh-action-count">{starCount}</span>
            </button>
          </div>
        </div>

        {/* Subnavigation Tabs */}
        <div className="gh-repo-tabs">
          <button
            className={`gh-repo-tab ${activeTab === "code" ? "active" : ""}`}
            onClick={() => setActiveTab("code")}
          >
            <CodeIcon size={16} />
            <span>Code</span>
          </button>
          <button
            className={`gh-repo-tab ${activeTab === "issues" ? "active" : ""}`}
            onClick={() => setActiveTab("issues")}
          >
            <IssueOpenedIcon size={16} />
            <span>Issues</span>
            {openIssuesCount > 0 && (
              <span className="gh-tab-badge">{openIssuesCount}</span>
            )}
          </button>
          <button
            className={`gh-repo-tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <GearIcon size={16} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="gh-repo-container">
        {/* ================= CODE TAB ================= */}
        {activeTab === "code" && (
          <div className="gh-code-view">
            {/* Description bar */}
            <div className="gh-repo-desc-bar">
              <p className="gh-repo-desc-text">
                {repo.description || repo.descriptions || (
                  <span className="gh-no-desc">No description provided.</span>
                )}
              </p>
            </div>

            {/* Code Controls */}
            <div className="gh-code-controls">
              <div className="gh-branch-selector">
                <button className="gh-btn gh-btn-sm">
                  <GitBranchIcon size={16} />
                  <strong>main</strong>
                </button>
                <span className="gh-text-muted gh-branch-count">1 branch</span>
              </div>

              <div className="gh-code-actions">
                <button
                  className="gh-btn gh-btn-sm"
                  onClick={() => setShowAddFileModal(true)}
                >
                  <PlusIcon size={16} />
                  Add file
                </button>

                <div className="gh-clone-group">
                  <button className="gh-btn gh-btn-primary gh-btn-sm" onClick={handleCopyClone}>
                    {copiedClone ? <CheckIcon size={16} /> : <CodeIcon size={16} />}
                    <span>{copiedClone ? "Copied!" : "Code"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Files Table */}
            <div className="gh-files-box">
              <div className="gh-files-header">
                <div className="gh-latest-commit">
                  <strong>{ownerName}</strong>
                  <span className="gh-commit-msg">Initial commit & file setup</span>
                </div>
                <div className="gh-commit-meta">
                  <span className="gh-commit-hash">latest</span>
                </div>
              </div>

              <div className="gh-files-list">
                {files.map((file, idx) => (
                  <div key={idx} className="gh-file-row">
                    <div className="gh-file-name">
                      <FileIcon size={16} className="gh-file-icon" />
                      <span>{file}</span>
                    </div>
                    <div className="gh-file-commit-msg">Add {file}</div>
                    <div className="gh-file-age">recently</div>
                  </div>
                ))}
              </div>
            </div>

            {/* README Preview Card */}
            <div className="gh-readme-box">
              <div className="gh-readme-header">
                <BookIcon size={16} />
                <strong>README.md</strong>
              </div>
              <div className="gh-readme-body">
                <h1>{repo.name}</h1>
                <p>
                  {repo.description ||
                    repo.descriptions ||
                    "Welcome to " + repo.name + "! This repository was created on GitHub."}
                </p>
                <hr />
                <h3>Files in this repository:</h3>
                <ul>
                  {files.map((f, i) => (
                    <li key={i}><code>{f}</code></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ================= ISSUES TAB ================= */}
        {activeTab === "issues" && (
          <div className="gh-issues-view">
            <div className="gh-issues-top-bar">
              <div className="gh-issues-filters">
                <button
                  className={`gh-filter-tab ${issueFilter === "open" ? "active" : ""}`}
                  onClick={() => setIssueFilter("open")}
                >
                  <IssueOpenedIcon size={16} />
                  <span>{openIssuesCount} Open</span>
                </button>
                <button
                  className={`gh-filter-tab ${issueFilter === "closed" ? "active" : ""}`}
                  onClick={() => setIssueFilter("closed")}
                >
                  <CheckIcon size={16} />
                  <span>{issues.filter((i) => i.status === "closed").length} Closed</span>
                </button>
                <button
                  className={`gh-filter-tab ${issueFilter === "all" ? "active" : ""}`}
                  onClick={() => setIssueFilter("all")}
                >
                  <span>All ({issues.length})</span>
                </button>
              </div>

              <button
                className="gh-btn gh-btn-primary"
                onClick={() => setShowNewIssueModal(true)}
              >
                <PlusIcon size={16} />
                New issue
              </button>
            </div>

            {/* Issue List Box */}
            <div className="gh-issues-list-box">
              {filteredIssues.length === 0 ? (
                <div className="gh-empty-issues">
                  <IssueOpenedIcon size={40} className="gh-empty-icon" />
                  <h3>No {issueFilter !== "all" ? issueFilter : ""} issues found</h3>
                  <p>There aren't any issues matching your filter right now.</p>
                </div>
              ) : (
                filteredIssues.map((issue) => {
                  const isOpen = issue.status === "open";
                  return (
                    <div key={issue._id} className="gh-issue-row">
                      <div className="gh-issue-status-col">
                        {isOpen ? (
                          <IssueOpenedIcon size={18} className="gh-icon-open" />
                        ) : (
                          <IssueClosedIcon size={18} className="gh-icon-closed" />
                        )}
                      </div>

                      <div className="gh-issue-main-col">
                        <div className="gh-issue-title-row">
                          <span className="gh-issue-title">{issue.title || issue.tittle}</span>
                        </div>
                        <p className="gh-issue-desc">{issue.description}</p>
                        <div className="gh-issue-subtext">
                          #{issue._id.slice(-4)} opened by{" "}
                          <strong>{issue.author?.username || "user"}</strong>
                        </div>
                      </div>

                      <div className="gh-issue-actions-col">
                        <button
                          className="gh-btn gh-btn-sm"
                          onClick={() => handleToggleIssueStatus(issue._id, issue.status)}
                          title={isOpen ? "Close issue" : "Reopen issue"}
                        >
                          {isOpen ? "Close issue" : "Reopen"}
                        </button>
                        <button
                          className="gh-btn gh-btn-sm gh-btn-danger"
                          onClick={() => handleDeleteIssue(issue._id)}
                          title="Delete issue"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= SETTINGS TAB ================= */}
        {activeTab === "settings" && (
          <div className="gh-settings-view">
            <div className="gh-settings-section">
              <h3>General Settings</h3>
              <div className="gh-field-group">
                <label>Repository Name</label>
                <input type="text" value={repo.name} disabled className="gh-input-disabled" />
              </div>

              <div className="gh-field-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Short description of this repository"
                />
              </div>

              <button
                className="gh-btn gh-btn-primary"
                onClick={handleSaveDescription}
                disabled={savingSettings}
              >
                {savingSettings ? "Saving..." : "Save changes"}
              </button>
            </div>

            <div className="gh-settings-section">
              <h3>Repository Visibility</h3>
              <p className="gh-text-muted">
                This repository is currently{" "}
                <strong>{repo.visibility ? "Public" : "Private"}</strong>.
              </p>
              <button className="gh-btn" onClick={handleToggleVisibility}>
                Change to {repo.visibility ? "Private" : "Public"}
              </button>
            </div>

            <div className="gh-settings-section gh-danger-zone">
              <h3>Danger Zone</h3>
              <div className="gh-danger-box">
                <div className="gh-danger-info">
                  <strong>Delete this repository</strong>
                  <p>Once you delete a repository, there is no going back. Please be certain.</p>
                </div>
                <button className="gh-btn gh-btn-danger" onClick={handleDeleteRepo}>
                  Delete repository
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* New Issue Modal */}
      {showNewIssueModal && (
        <div className="gh-modal-backdrop" onClick={() => setShowNewIssueModal(false)}>
          <div className="gh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gh-modal-header">
              <h2>New Issue</h2>
              <button className="gh-modal-close" onClick={() => setShowNewIssueModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateIssue} className="gh-issue-form">
              <div className="gh-field-group">
                <label>Title *</label>
                <input
                  type="text"
                  placeholder="Title of the issue"
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="gh-field-group">
                <label>Description</label>
                <textarea
                  rows={4}
                  placeholder="Leave a comment or description..."
                  value={newIssueDesc}
                  onChange={(e) => setNewIssueDesc(e.target.value)}
                />
              </div>
              <div className="gh-modal-footer">
                <button
                  type="button"
                  className="gh-btn"
                  onClick={() => setShowNewIssueModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gh-btn gh-btn-primary"
                  disabled={submittingIssue || !newIssueTitle.trim()}
                >
                  {submittingIssue ? "Submitting..." : "Submit new issue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add File Modal */}
      {showAddFileModal && (
        <div className="gh-modal-backdrop" onClick={() => setShowAddFileModal(false)}>
          <div className="gh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gh-modal-header">
              <h2>Add File</h2>
              <button className="gh-modal-close" onClick={() => setShowAddFileModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAddFile} className="gh-add-file-form">
              <div className="gh-field-group">
                <label>File name *</label>
                <input
                  type="text"
                  placeholder="e.g. index.html, utils.js, styles.css"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="gh-modal-footer">
                <button
                  type="button"
                  className="gh-btn"
                  onClick={() => setShowAddFileModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gh-btn gh-btn-primary"
                  disabled={submittingFile || !newFileName.trim()}
                >
                  {submittingFile ? "Adding..." : "Commit new file"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepositoryView;
