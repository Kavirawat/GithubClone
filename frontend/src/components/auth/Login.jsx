import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../authContext";
import "./auth.css";
import logo from "../../assets/github-mark-white.svg";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const res = await axios.post("http://localhost:3000/login", {
        email: email.trim(),
        password: password,
      });

      if (loginUser) {
        loginUser(res.data.token, res.data.userId, res.data.username);
      } else {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.userId);
        if (res.data.username) localStorage.setItem("username", res.data.username);
      }

      setLoading(false);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid email or password.");
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
            Sign in to GitHub
          </h1>
        </div>

        {error && <div className="gh-auth-error">{error}</div>}

        <form className="login-box" onSubmit={handleLogin}>
          <div>
            <label className="label" htmlFor="Email">
              Username or email address
            </label>
            <input
              autoComplete="off"
              name="Email"
              id="Email"
              className="input"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="div">
            <label className="label" htmlFor="Password">
              Password
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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="pass-box">
          <p>
            New to GitHub? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
