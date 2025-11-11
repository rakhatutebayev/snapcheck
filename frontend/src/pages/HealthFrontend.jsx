import React from 'react';

export default function HealthFrontend() {
  return (
    <div style={{padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial'}}>
      <h1>Frontend OK</h1>
      <p>This page is served by Vite dev server.</p>
      <ul>
        <li>Build: dev</li>
        <li>Route: /health-frontend</li>
      </ul>
    </div>
  );
}
