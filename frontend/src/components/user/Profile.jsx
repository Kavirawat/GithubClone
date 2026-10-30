import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../authContext";
import Navbar from "../navbar/Navbar";
import CreateRepoModal from "../repo/CreateRepoModal";
import {
  RepoIcon,
  BookIcon,
  StarIcon,
  PeopleIcon,
  LocationIcon,
  LinkIcon,
  PlusIcon,
  FileIcon,
} from "@primer/octicons-react";
import "./profile.css";

const Profile = () => {
  const { currentUser, userProfile, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [userRepos, setUserRepos] = useState([]);
  const [starredRepos, setStarredRepos] = useState([]);
  const [allRepos, setAllRepos] = useState([]);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'repositories' | 'starred'
  const [repoSearch, setRepoSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit Profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Create repo modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProfileAndRepos = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.all([
        axios.get(`http://localhost:3000/userProfile/${currentUser}`),
        axios.get("http://localhost:3000/repo/all"),
      ]);

      const user = uRes.data;
      setProfileData(user);
      setEditBio(user.bio || "");
      setEditLocation(user.location || "");
      setEditAvatar(user.avatarUrl || "");

      const all = rRes.data.repositories || [];
      setAllRepos(all);

      // Repos owned by this user
      const owned = all.filter(
        (r) =>
          (r.owner?._id || r.owner) === currentUser ||
          r.owner?.username === user.username
      );
      setUserRepos(owned);

      // Repos starred by this user
      const starred = all.filter((r) =>
        (r.stars || []).some((s) => (s._id || s).toString() === currentUser)
      );
      setStarredRepos(starred);

      setLoading(false);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndRepos();
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await axios.put(`http://localhost:3000/updateProfile/${currentUser}`, {
        bio: editBio,
        location: editLocation,
        avatarUrl: editAvatar,
      });

      setProfileData((prev) => ({
        ...prev,
        bio: editBio,
        location: editLocation,
        avatarUrl: editAvatar,
      }));

      refreshUser();
      setSavingProfile(false);
      setShowEditModal(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setSavingProfile(false);
      alert("Failed to update profile.");
    }
  };

  const username = profileData?.username || userProfile?.username || "developer";
  const avatarLetter = username.charAt(0).toUpperCase();

  const filteredRepos = userRepos.filter((r) =>
    r.name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  // Generate GitHub Heatmap contribution boxes (52 weeks x 7 days)
  const renderHeatmap = () => {
    const weeks = [];
    // Seeded random for consistent visual pattern
    let seed = 42;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let w = 0; w < 48; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const r = random();
        let level = 0;
        if (r > 0.85) level = 4;
        else if (r > 0.65) level = 3;
        else if (r > 0.45) level = 2;
        else if (r > 0.25) level = 1;
        days.push(level);
      }
      weeks.push(days);
    }

    return (
      <div className="gh-heatmap-wrapper">
        <div className="gh-heatmap-grid">
          {weeks.map((days, wIdx) => (
            <div key={wIdx} className="gh-heatmap-week">
              {days.map((level, dIdx) => (
                <div
                  key={dIdx}
                  className={`gh-heat-cell level-${level}`}
                  title={`${level > 0 ? level * 2 + 1 : 0} contributions`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="gh-heatmap-legend">
          <span>Less</span>
          <div className="gh-heat-cell level-0" />
          <div className="gh-heat-cell level-1" />
          <div className="gh-heat-cell level-2" />
          <div className="gh-heat-cell level-3" />
          <div className="gh-heat-cell level-4" />
          <span>More</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="gh-page">
        <Navbar />
        <div className="gh-loading-container">
          <div className="gh-spinner" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="gh-page">
      <Navbar />

      <div className="gh-profile-layout">
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="gh-profile-sidebar">
          <div className="gh-profile-avatar-container">
            {profileData?.avatarUrl ? (
              <img
                src={profileData.avatarUrl}
                alt={username}
                className="gh-profile-avatar-img"
              />
            ) : (
              <div className="gh-profile-avatar-fallback">{avatarLetter}</div>
            )}
          </div>

          <div className="gh-profile-names">
            <h1 className="gh-profile-display-name">{username}</h1>
            <span className="gh-profile-username">@{username}</span>
          </div>

          {profileData?.bio && (
            <p className="gh-profile-bio">{profileData.bio}</p>
          )}

          <button
            className="gh-btn gh-btn-block mt-3"
            onClick={() => setShowEditModal(true)}
          >
            Edit profile
          </button>

          <div className="gh-profile-stats">
            <div className="gh-stat-item">
              <PeopleIcon size={16} />
              <span>
                <strong>0</strong> followers
              </span>
              <span>·</span>
              <span>
                <strong>0</strong> following
              </span>
            </div>
          </div>

          <div className="gh-profile-meta">
            {profileData?.email && (
              <div className="gh-meta-item">
                <LinkIcon size={16} />
                <span>{profileData.email}</span>
              </div>
            )}
            {profileData?.location && (
              <div className="gh-meta-item">
                <LocationIcon size={16} />
                <span>{profileData.location}</span>
              </div>
            )}
          </div>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="gh-profile-main">
          {/* Subnav Tabs */}
          <div className="gh-profile-nav-tabs">
            <button
              className={`gh-profile-tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <BookIcon size={16} />
              <span>Overview</span>
            </button>
            <button
              className={`gh-profile-tab ${activeTab === "repositories" ? "active" : ""}`}
              onClick={() => setActiveTab("repositories")}
            >
              <RepoIcon size={16} />
              <span>Repositories</span>
              <span className="gh-tab-badge">{userRepos.length}</span>
            </button>
            <button
              className={`gh-profile-tab ${activeTab === "starred" ? "active" : ""}`}
              onClick={() => setActiveTab("starred")}
            >
              <StarIcon size={16} />
              <span>Starred</span>
              <span className="gh-tab-badge">{starredRepos.length}</span>
            </button>
          </div>

          {/* ================= OVERVIEW TAB ================= */}
          {activeTab === "overview" && (
            <div className="gh-overview-content">
              <div className="gh-section-header">
                <h3>Popular Repositories</h3>
              </div>

              <div className="gh-pinned-repos-grid">
                {userRepos.length === 0 ? (
                  <p className="gh-text-muted">No repositories to pin yet.</p>
                ) : (
                  userRepos.slice(0, 6).map((repo) => (
                    <div key={repo._id} className="gh-pinned-card">
                      <div className="gh-pinned-card-header">
                        <RepoIcon size={14} className="gh-text-muted" />
                        <Link to={`/repo/${repo._id}`} className="gh-pinned-title">
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
                      <p className="gh-pinned-desc">
                        {repo.description || repo.descriptions || "No description provided."}
                      </p>
                      <div className="gh-pinned-meta">
                        <span className="gh-lang-dot" />
                        <span>JavaScript</span>
                        <div className="gh-pinned-stars">
                          <StarIcon size={14} />
                          <span>{(repo.stars || []).length}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Heatmap Contribution Section */}
              <div className="gh-contributions-section">
                <div className="gh-section-header">
                  <h3>128 contributions in the last year</h3>
                </div>
                <div className="gh-heatmap-card">
                  {renderHeatmap()}
                </div>
              </div>
            </div>
          )}

          {/* ================= REPOSITORIES TAB ================= */}
          {activeTab === "repositories" && (
            <div className="gh-repos-tab-content">
              <div className="gh-repos-controls">
                <input
                  type="text"
                  placeholder="Find a repository..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className="gh-repo-search-input"
                />
                <button
                  className="gh-btn gh-btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <PlusIcon size={16} />
                  New
                </button>
              </div>

              <div className="gh-profile-repos-list">
                {filteredRepos.length === 0 ? (
                  <div className="gh-empty-list">
                    <p>No repositories match the search criteria.</p>
                  </div>
                ) : (
                  filteredRepos.map((repo) => (
                    <div key={repo._id} className="gh-profile-repo-row">
                      <div className="gh-profile-repo-info">
                        <div className="gh-profile-repo-title-row">
                          <Link to={`/repo/${repo._id}`} className="gh-repo-link">
                            <h3>{repo.name}</h3>
                          </Link>
                          <span
                            className={`gh-badge ${
                              repo.visibility ? "public" : "private"
                            }`}
                          >
                            {repo.visibility ? "Public" : "Private"}
                          </span>
                        </div>
                        <p className="gh-profile-repo-desc">
                          {repo.description || repo.descriptions || "No description."}
                        </p>
                        <div className="gh-profile-repo-meta">
                          <span className="gh-lang-dot" />
                          <span>JavaScript</span>
                          <span className="gh-stars-count">
                            <StarIcon size={14} />
                            {(repo.stars || []).length}
                          </span>
                          <span>Updated recently</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= STARRED TAB ================= */}
          {activeTab === "starred" && (
            <div className="gh-starred-tab-content">
              <div className="gh-profile-repos-list">
                {starredRepos.length === 0 ? (
                  <div className="gh-empty-list">
                    <p>You haven't starred any repositories yet.</p>
                  </div>
                ) : (
                  starredRepos.map((repo) => (
                    <div key={repo._id} className="gh-profile-repo-row">
                      <div className="gh-profile-repo-info">
                        <div className="gh-profile-repo-title-row">
                          <Link to={`/repo/${repo._id}`} className="gh-repo-link">
                            <h3>
                              {repo.owner?.username || "user"} / {repo.name}
                            </h3>
                          </Link>
                          <span
                            className={`gh-badge ${
                              repo.visibility ? "public" : "private"
                            }`}
                          >
                            {repo.visibility ? "Public" : "Private"}
                          </span>
                        </div>
                        <p className="gh-profile-repo-desc">
                          {repo.description || repo.descriptions || "No description."}
                        </p>
                        <div className="gh-profile-repo-meta">
                          <span className="gh-lang-dot" />
                          <span>JavaScript</span>
                          <span className="gh-stars-count">
                            <StarIcon size={14} fill="#e3b341" />
                            {(repo.stars || []).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="gh-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="gh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gh-modal-header">
              <h2>Edit Profile</h2>
              <button className="gh-modal-close" onClick={() => setShowEditModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="gh-edit-profile-form">
              <div className="gh-field-group">
                <label>Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Add a bio to your profile..."
                />
              </div>

              <div className="gh-field-group">
                <label>Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. India, San Francisco"
                />
              </div>

              <div className="gh-field-group">
                <label>Avatar Image URL</label>
                <input
                  type="url"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                />
              </div>

              <div className="gh-modal-footer">
                <button
                  type="button"
                  className="gh-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gh-btn gh-btn-primary"
                  disabled={savingProfile}
                >
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateRepoModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newRepo) => {
            setUserRepos([newRepo, ...userRepos]);
          }}
        />
      )}
    </div>
  );
};

export default Profile;
