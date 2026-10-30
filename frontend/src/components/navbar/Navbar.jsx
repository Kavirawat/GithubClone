import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../authContext";
import {
  MarkGithubIcon,
  SearchIcon,
  PlusIcon,
  SignOutIcon,
  RepoIcon,
  PeopleIcon,
} from "@primer/octicons-react";
import CreateRepoModal from "../repo/CreateRepoModal";
import "./navbar.css";

const Navbar = ({ onSearch, onRepoCreated }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewRepoModal, setShowNewRepoModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) onSearch(val);
  };

  const username = userProfile?.username || localStorage.getItem("username") || "User";
  const avatarLetter = username.charAt(0).toUpperCase();

  return (
    <>
      <header className="gh-navbar">
        <div className="gh-nav-left">
          <Link to="/" className="gh-nav-logo" title="GitHub Dashboard">
            <MarkGithubIcon size={32} />
          </Link>

          <div className="gh-nav-search">
            <SearchIcon size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Type / to search repositories..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="gh-search-input"
            />
            <span className="search-badge">/</span>
          </div>

          <nav className="gh-nav-links">
            <Link to="/" className="gh-nav-link">Dashboard</Link>
            <Link to="/profile" className="gh-nav-link">Profile</Link>
          </nav>
        </div>

        <div className="gh-nav-right">
          <button
            className="gh-btn gh-btn-primary gh-btn-sm"
            onClick={() => setShowNewRepoModal(true)}
            title="Create new repository"
          >
            <PlusIcon size={16} />
            <span>New</span>
          </button>

          <div className="gh-user-menu-container">
            <button
              className="gh-avatar-btn"
              onClick={() => setShowDropdown(!showDropdown)}
              title="User menu"
            >
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt={username} className="gh-avatar-img" />
              ) : (
                <div className="gh-avatar-fallback">{avatarLetter}</div>
              )}
            </button>

            {showDropdown && (
              <div className="gh-dropdown-menu" onClick={() => setShowDropdown(false)}>
                <div className="gh-dropdown-header">
                  Signed in as <strong>{username}</strong>
                </div>
                <div className="gh-dropdown-divider" />
                <Link to="/profile" className="gh-dropdown-item">
                  <PeopleIcon size={16} />
                  Your profile
                </Link>
                <Link to="/" className="gh-dropdown-item">
                  <RepoIcon size={16} />
                  Your repositories
                </Link>
                <div className="gh-dropdown-divider" />
                <button className="gh-dropdown-item gh-dropdown-danger" onClick={logout}>
                  <SignOutIcon size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showNewRepoModal && (
        <CreateRepoModal
          onClose={() => setShowNewRepoModal(false)}
          onCreated={(repo) => {
            setShowNewRepoModal(false);
            if (onRepoCreated) onRepoCreated(repo);
            navigate(`/repo/${repo._id}`);
          }}
        />
      )}
    </>
  );
};

export default Navbar;
