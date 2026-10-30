import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../authContext";
import "./auth.css";
import logo from "../../assets/github-mark-white.svg";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const res = await axios.post("http://localhost:3000/signup", {
        email: email.trim(),
        password: password,
        username: username.trim(),
      });

      const token = res.data.token;
      const userId = res.data.userId;

      if (loginUser) {
        loginUser(token, userId, username.trim());
      } else {
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
        localStorage.setItem("username", username.trim());
      }

      setLoading(false);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Signup failed! Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-logo-container">
        <Link to="/auth">
          <img className="logo-login" src={logo} alt="GitHub Logo" />
        </Link>
      </div>

      <div className="login-box-wrapper">
        <div className="login-heading">
          <h1 style={{ fontSize: "24px", fontWeight: "300", color: "#f0f6fc", textAlign: "center" }}>
            Sign up for GitHub
          </h1>
        </div>

        {error && <div className="gh-auth-error">{error}</div>}

        <form className="login-box" onSubmit={handleSignup}>
          <div>
            <label className="label" htmlFor="Username">
              Username *
            </label>
            <input
              autoComplete="off"
              name="Username"
              id="Username"
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="Email">
              Email address *
            </label>
            <input
              autoComplete="off"
              name="Email"
              id="Email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="div">
            <label className="label" htmlFor="Password">
              Password *
            </label>
            <input
              autoComplete="off"
              name="Password"
              id="Password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="gh-btn gh-btn-primary login-btn"
            disabled={loading}
            type="submit"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="pass-box">
          <p>
            Already have an account? <Link to="/auth">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
