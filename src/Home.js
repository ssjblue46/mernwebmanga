import React, { useEffect, useRef, useState } from "react";

const BASE_URL = "https://mernwebmanga.onrender.com";

function Home({ pdfs, setPdfs }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false); // Added loading state
  const userRole = localStorage.getItem("userRole");
  // Fetch PDFs
  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/pdfs`);
        const data = await res.json();
        
        // Handle different possible API response shapes
        const list = Array.isArray(data) ? data : (data.pdfs || []);
        setPdfs(list);
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
    if (!files || files.length === 0) return;

    setLoading(true); // Start loading
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("pdfs", files[i]);
    }

    try {
      const res = await fetch(`${BASE_URL}/api/pdfs`, {
         
        method: "POST",
         headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}` // ✅ ADD THIS
  },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const newPdfs = Array.isArray(data) ? data : (data.pdfs || []);

      // If backend returns only new files, append them. 
      // If it returns the FULL list, use: setPdfs(newPdfs);
      setPdfs((prev) => [...prev, ...newPdfs]);

      alert("Upload successful ✅");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed ❌");
    } finally {
      setLoading(false); // End loading
      e.target.value = ""; // Clear input so you can upload same file again
    }
  };

  // Helper to ensure URL is clean
  const getFullUrl = (path) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  };
const handleDelete = async (id) => {
  if (!window.confirm("Delete this PDF?")) return;

  try {
    const res = await fetch(`${BASE_URL}/api/pdfs/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!res.ok) throw new Error();

    setPdfs(prev => prev.filter(p => p._id !== id));
  } catch {
    alert("Delete failed ❌");
  }
};
  return (
    <div className="page home-page">
{(userRole === "admin" || userRole === "creator") ? (
  <>
    <button
      disabled={loading}
      onClick={() => fileInputRef.current.click()}
      style={{
        background: loading ? "#555" : "#1c1c1c",
        color: "#fff",
        borderRadius: "30px",
        padding: "12px 25px",
        fontWeight: "bold",
        border: "1px solid #333",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: "16px",
      }}
    >
      {loading ? "⌛ Uploading..." : "📤 Upload PDFs"}
    </button>

    <input
      type="file"
      accept="application/pdf"
      multiple
      ref={fileInputRef}
      onChange={handleUpload}
      style={{ display: "none" }}
    />
  </>
) : (
  <p style={{ color: "#aaa", marginTop: "10px" }}>
    🔒 Only creators/admin can upload PDFs
  </p>
)}
  {(userRole === "admin" || userRole === "creator") && (
  <button
    onClick={() => handleDelete(pdf._id)}
      style={{
        background: loading ? "#555" : "#1c1c1c",
        color: "#fff",
        borderRadius: "30px",
        padding: "12px 25px",
        fontWeight: "bold",
        border: "1px solid #333",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: "16px",
    }}
  >
    🗑 Delete
  </button>
)}
      <h2>📁 Manga Collection (PDF)</h2>

      <div className="pdf-grid">
        {pdfs.length === 0 && !loading && <p>No PDFs uploaded yet.</p>}

        {pdfs.map((pdf, index) => (
          <div key={pdf._id || index} className="pdf-card">
            <iframe
              src={`${getFullUrl(pdf.url)}#toolbar=0&navpanes=0`}
              title={pdf.name}
              className="pdf-preview"
              style={{ width: "100%", height: "250px", border: "none" }}
            ></iframe>

            <p className="pdf-name">
              {(pdf.name || "Untitled").replace(/\.pdf$/i, "")}
            </p>

            <a
              href={getFullUrl(pdf.url)}
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
