import React from 'react';

export default function Home() {
  return (
    <div className="card">
      <h2>Web 版 AI 旅行规划师</h2>
      <p className="muted">通过语音或文字描述需求，自动生成个性化行程，并记录预算与开销。</p>
      <ul>
        <li>智能行程规划：目的地、日期、预算、偏好一键生成</li>
        <li>费用预算与管理：语音或文本快速记账</li>
        <li>设置页：输入并管理你的 API Key（不写在代码里）</li>
      </ul>
    </div>
  );
}