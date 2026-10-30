import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../authContext";
import Navbar from "../navbar/Navbar";
import CreateRepoModal from "../repo/CreateRepoModal";
import {
  RepoIcon,
  PlusIcon,
  StarIcon,
  BookIcon,
  LockIcon,
  SearchIcon,
  PeopleIcon,
  FileIcon,
} from "@primer/octicons-react";
import "./dashboard.css";

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [repositories, setRepositories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRepoSearch, setUserRepoSearch] = useState("");
  const [feedFilter, setFeedFilter] = useState("all"); // 'all' | 'public' | 'private'
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [repoRes, usersRes] = await Promise.all([
        axios.get("http://localhost:3000/repo/all"),
        axios.get("http://localhost:3000/allUsers"),
      ]);

      setRepositories(repoRes.data.repositories || []);
      setUsers(usersRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleToggleStar = async (repoId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;

    try {
      const res = await axios.post(`http://localhost:3000/repo/star/${repoId}`, {
        userId: currentUser,
      });

      setRepositories((prevRepos) =>
        prevRepos.map((repo) => {
          if (repo._id === repoId) {
            let stars = repo.stars ? [...repo.stars] : [];
            if (res.data.starred) {
              if (!stars.includes(currentUser)) stars.push(currentUser);
            } else {
              stars = stars.filter((s) => (s._id || s).toString() !== currentUser);
            }
            return { ...repo, stars };
          }
          return repo;
        })
      );
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  };

  const username = userProfile?.username || localStorage.getItem("username") || "User";

  // Repositories owned by current user
  const myRepositories = repositories.filter(
    (repo) =>
      repo.owner?._id === currentUser ||
      repo.owner === currentUser ||
      repo.owner?.username === username
  );

  const filteredMyRepos = myRepositories.filter((repo) =>
    repo.name.toLowerCase().includes(userRepoSearch.toLowerCase())
  );

  // Global feed filtered repositories
  const filteredFeedRepos = repositories.filter((repo) => {
    const matchesSearch =
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (repo.description || repo.descriptions || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (repo.owner?.username || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (feedFilter === "public") return repo.visibility === true;
    if (feedFilter === "private") return repo.visibility === false;
    return true;
  });

  return (
    <div className="gh-page">
      <Navbar
        onSearch={(term) => setSearchTerm(term)}
        onRepoCreated={(newRepo) => {
          setRepositories([newRepo, ...repositories]);
        }}
      />

      <div className="gh-dashboard-layout">
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="gh-dash-sidebar-left">
          <div className="gh-sidebar-user-mini">
            <div className="gh-avatar-fallback gh-avatar-mini">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="gh-user-mini-text">
              <strong>{username}</strong>
              <Link to="/profile" className="gh-view-profile-link">
                View profile
              </Link>
            </div>
          </div>

          <div className="gh-sidebar-section">
            <div className="gh-sidebar-header">
              <h3>Top Repositories</h3>
              <button
                className="gh-btn gh-btn-primary gh-btn-sm"
                onClick={() => setShowCreateModal(true)}
              >
                <PlusIcon size={14} />
                New
              </button>
            </div>

            <div className="gh-search-my-repos">
              <input
                type="text"
                placeholder="Find a repository..."
                value={userRepoSearch}
                onChange={(e) => setUserRepoSearch(e.target.value)}
                className="gh-input-sm"
              />
            </div>

            <div className="gh-my-repos-list">
              {filteredMyRepos.length === 0 ? (
                <div className="gh-no-repos">
                  <p>No repositories found</p>
                  <button
                    className="gh-btn gh-btn-sm gh-btn-primary mt-2"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create a repository
                  </button>
                </div>
              ) : (
                filteredMyRepos.map((repo) => (
                  <Link
                    key={repo._id}
                    to={`/repo/${repo._id}`}
                    className="gh-my-repo-item"
                  >
                    <RepoIcon size={14} className="gh-text-muted" />
                    <span className="gh-my-repo-name">
                      {repo.name}
                    </span>
                    <span className={`gh-badge-mini ${repo.visibility ? "public" : "private"}`}>
                      {repo.visibility ? "Public" : "Private"}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* ================= CENTER FEED ================= */}
        <main className="gh-dash-feed">
          <div className="gh-feed-header">
            <h2>Home Feed</h2>
            <div className="gh-feed-filters">
              <button
                className={`gh-feed-filter-btn ${feedFilter === "all" ? "active" : ""}`}
                onClick={() => setFeedFilter("all")}
              >
                All
              </button>
              <button
                className={`gh-feed-filter-btn ${feedFilter === "public" ? "active" : ""}`}
                onClick={() => setFeedFilter("public")}
              >
                Public
              </button>
              <button
                className={`gh-feed-filter-btn ${feedFilter === "private" ? "active" : ""}`}
                onClick={() => setFeedFilter("private")}
              >
                Private
              </button>
            </div>
          </div>

          {/* Quick Welcome Banner */}
          <div className="gh-feed-banner">
            <div className="gh-banner-content">
              <h3>Welcome to GitHub Clone!</h3>
              <p>
                Explore open source repositories, manage issues, collaborate, and share your code.
              </p>
            </div>
            <button
              className="gh-btn gh-btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon size={16} />
              New Repository
            </button>
          </div>

          {/* Repository Feed */}
          {loading ? (
            <div className="gh-loading-container">
              <div className="gh-spinner" />
              <span>Loading repositories...</span>
            </div>
          ) : filteredFeedRepos.length === 0 ? (
            <div className="gh-empty-feed">
              <RepoIcon size={48} className="gh-text-muted" />
              <h3>No repositories found</h3>
              <p>Try searching for something else or create a new repository.</p>
              <button
                className="gh-btn gh-btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                Create Repository
              </button>
            </div>
          ) : (
            <div className="gh-repo-cards-list">
              {filteredFeedRepos.map((repo) => {
                const isStarred = (repo.stars || []).some(
                  (s) => (s._id || s).toString() === currentUser
                );
                const starTotal = (repo.stars || []).length;
                const owner = repo.owner?.username || "user";

                return (
                  <div key={repo._id} className="gh-repo-card">
                    <div className="gh-repo-card-header">
                      <div className="gh-repo-card-title-group">
                        <RepoIcon size={16} className="gh-text-muted" />
                        <Link to={`/repo/${repo._id}`} className="gh-repo-card-title">
                          <span className="gh-repo-card-owner">{owner}</span>
                          <span className="gh-slash">/</span>
                          <strong>{repo.name}</strong>
                        </Link>
                        <span
                          className={`gh-badge ${
                            repo.visibility ? "public" : "private"
                          }`}
                        >
                          {repo.visibility ? "Public" : "Private"}
                        </span>
                      </div>

                      <button
                        className={`gh-btn gh-btn-sm ${
                          isStarred ? "gh-btn-starred" : ""
                        }`}
                        onClick={(e) => handleToggleStar(repo._id, e)}
                        title={isStarred ? "Unstar" : "Star"}
                      >
                        <StarIcon
                          size={14}
                          fill={isStarred ? "#e3b341" : "currentColor"}
                        />
                        <span>{isStarred ? "Starred" : "Star"}</span>
                        <span className="gh-action-count">{starTotal}</span>
                      </button>
                    </div>

                    <p className="gh-repo-card-desc">
                      {repo.description ||
                        repo.descriptions ||
                        "No description provided for this repository."}
                    </p>

                    <div className="gh-repo-card-footer">
                      <div className="gh-repo-lang">
                        <span className="gh-lang-dot" />
                        <span>JavaScript</span>
                      </div>

                      {repo.content && repo.content.length > 0 && (
                        <div className="gh-repo-files-preview">
                          <FileIcon size={12} className="gh-text-muted" />
                          <span>{repo.content.length} files</span>
                        </div>
                      )}

                      <span className="gh-repo-updated-time">
                        Updated recently
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ================= RIGHT SIDEBAR ================= */}
        <aside className="gh-dash-sidebar-right">
          <div className="gh-sidebar-box">
            <div className="gh-sidebar-box-header">
              <PeopleIcon size={16} />
              <h4>Community Users</h4>
            </div>

            <div className="gh-users-list">
              {users.map((u) => (
                <div key={u._id} className="gh-user-row">
                  <div className="gh-avatar-fallback gh-avatar-mini">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="gh-user-row-info">
                    <strong>{u.username}</strong>
                    <span>{u.email}</span>
                  </div>
                  <Link
                    to="/profile"
                    className="gh-btn gh-btn-sm"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="gh-sidebar-box gh-links-box">
            <h4>GitHub Resources</h4>
            <ul>
              <li><a href="https://docs.github.com" target="_blank" rel="noreferrer">Documentation</a></li>
              <li><a href="https://github.blog" target="_blank" rel="noreferrer">GitHub Blog</a></li>
              <li><a href="https://github.com/features" target="_blank" rel="noreferrer">Explore Features</a></li>
            </ul>
          </div>
        </aside>
      </div>

      {showCreateModal && (
        <CreateRepoModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newRepo) => {
            setRepositories([newRepo, ...repositories]);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
