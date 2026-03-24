import React, { useEffect, useRef } from "react";

const BASE_URL = "https://mernwebmanga.onrender.com"; // ✅ FIXED

function Home({ pdfs, setPdfs }) {
  const fileInputRef = useRef(null);

  // Fetch PDFs
  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/pdfs`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setPdfs(data);
        } else if (Array.isArray(data.pdfs)) {
          setPdfs(data.pdfs);
        } else {
          setPdfs([]);
        }
      } catch (err) {
        console.error("Error fetching PDFs:", err);
        setPdfs([]);
      }
    };

    fetchPdfs();
  }, [setPdfs]);

  // Upload PDFs
  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("pdfs", files[i]);
    }

    try {
      const res = await fetch(`${BASE_URL}/api/pdfs`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      let newPdfs = [];
      if (Array.isArray(data)) {
        newPdfs = data;
      } else if (Array.isArray(data.pdfs)) {
        newPdfs = data.pdfs;
      }

      setPdfs((prev) => [...prev, ...newPdfs]);

      alert("Upload successful ✅");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed ❌");
    }
  };

  return (
    <div className="page home-page">
      <button
        onClick={() => fileInputRef.current.click()}
        style={{
          background: "#1c1c1c",
          color: "#fff",
          borderRadius: "30px",
          padding: "12px 25px",
          fontWeight: "bold",
          border: "1px solid #333",
          cursor: "pointer",
          transition: "all 0.3s ease",
          fontSize: "16px",
        }}
      >
        📤 Upload PDFs
      </button>

      <input
        type="file"
        accept="application/pdf"
        multiple
        ref={fileInputRef}
        onChange={handleUpload}
        style={{ display: "none" }}
      />

      <h2>📁 Manga Collection (PDF)</h2>

      <div className="pdf-grid">
        {(!Array.isArray(pdfs) || pdfs.length === 0) && (
          <p>No PDFs uploaded yet.</p>
        )}

        {Array.isArray(pdfs) &&
          pdfs.map((pdf, index) => (
            <div key={index} className="pdf-card">
              <iframe
                src={`${BASE_URL}${pdf.url}#toolbar=0&navpanes=0&scrollbar=0`}
                title={pdf.name}
                className="pdf-preview"
              ></iframe>

              <p className="pdf-name">
                {pdf.name.replace(/\.pdf$/i, "")}
              </p>

              <a
                href={`${BASE_URL}${pdf.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="open-btn"
              >
                🔎 Open PDF
              </a>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Home;
