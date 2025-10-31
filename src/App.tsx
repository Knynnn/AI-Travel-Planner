import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="brand">AI Travel Planner</div>
        <nav className="nav">
          <NavLink to="/" end>首页</NavLink>
          <NavLink to="/plan">行程规划</NavLink>
          <NavLink to="/budget">预算与开销</NavLink>
          <NavLink to="/settings">设置</NavLink>
          <NavLink to="/login">登录</NavLink>
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <span>© 2025 AI Travel Planner</span>
      </footer>
    </div>
  );
}