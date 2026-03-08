import Home from './Home';
import React from 'react';

function MainAppContent({ pdfs, setPdfs, userRole }) {
  return (
    <div className="app-container">
      <div style={{ width: "100%", maxWidth: 1200, textAlign: "center", marginBottom: 8 }}>
        <small style={{ color: "#ccc" }}>Role: <strong>{userRole}</strong></small>
      </div>

      {/* Main content - Home component */}
      <Home pdfs={pdfs} setPdfs={setPdfs} userRole={userRole} />
    </div>
  );
}

export default MainAppContent;
