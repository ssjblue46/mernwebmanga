import React, { useEffect, useRef } from "react";




function Home({ pdfs, setPdfs }) {
  const fileInputRef = useRef(null);




  // Fetch existing PDFs when page loads
  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/pdfs");
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




  // Handle file upload
  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;




    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("pdfs", files[i]);
    }




    try {
      const res = await fetch("http://localhost:5000/api/pdfs", {
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
    } catch (err) {
      console.error("Upload error:", err);
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
    display: "inline-block",
    position: "relative",
    overflow: "hidden",
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.background = "#15aee1";
    e.currentTarget.style.boxShadow = "0 0 15px #15aee1";
    e.currentTarget.style.transform = "scale(1.1)";
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.background = "#f77f0fff";
    e.currentTarget.style.boxShadow = "none";
    e.currentTarget.style.transform = "scale(1)";
  }}
>
  📤 Upload PDFs
  <input
    type="file"
    accept="application/pdf"
    multiple
    ref={fileInputRef}
    onChange={handleUpload}
    style={{
      display: "none",
    }}
  />
</button>


      <h2>📁Manga Collection(pdf)</h2>


      {/* PDF Preview Section */}
      <div className="pdf-grid">
        {(!Array.isArray(pdfs) || pdfs.length === 0) && (
          <p>No PDFs uploaded yet.</p>
        )}




        {Array.isArray(pdfs) &&
          pdfs.map((pdf, index) => (
            <div key={index} className="pdf-card">
              <iframe
                src={pdf.url + "#toolbar=0&navpanes=0&scrollbar=0"}
                title={pdf.name}
                className="pdf-preview"
              ></iframe>
              {/* 👇 Hide .pdf extension */}
              <p className="pdf-name">{pdf.name.replace(/\.pdf$/i, "")}</p>
         
              <a
                href={pdf.url}
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
