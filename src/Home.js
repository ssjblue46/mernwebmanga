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
  const token = localStorage.getItem("userToken");
  if (!token) {
    alert("Please login first");
    return;
  }

  const files = e.target.files;
  if (!files?.length) return;

  setLoading(true);

  const formData = new FormData();
  for (let f of files) formData.append("pdfs", f);

  try {
    const res = await fetch(`${BASE_URL}/api/pdfs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData,
    });

    if (res.status === 401) {
      alert("Session expired. Login again.");
      return;
    }

    if (!res.ok) throw new Error();

    const data = await res.json();
    setPdfs(prev => [...prev, ...data]);

  } catch {
    alert("Upload failed ❌");
  } finally {
    setLoading(false);
    e.target.value = "";
  }
};

  // Helper to ensure URL is clean
  const getFullUrl = (path) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  };
const handleDelete = async (id) => {
  const token = localStorage.getItem("userToken");

  if (!token) {
    alert("Not logged in");
    return;
  }

  if (!window.confirm("Delete this PDF?")) return;

  try {
    const res = await fetch(`${BASE_URL}/api/pdfs/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      alert("Session expired. Login again.");
      return;
    }

    if (res.status === 403) {
      alert("You can't delete this file ❌");
      return;
    }

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
                {(userRole === "admin" || pdf.owner === userId) && (
  <button
    onClick={() => handleDelete(pdf._id)}
    style={{
      marginTop: "8px",
      background: "red",
      color: "white",
      border: "none",
      padding: "6px 10px",
      borderRadius: "6px",
      cursor: "pointer"
    }}
  >
    🗑 Delete
  </button>
)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
