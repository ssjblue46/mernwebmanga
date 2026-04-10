import React, { useRef, useState } from "react";
import { jsPDF } from "jspdf";

const PaintPage = () => {
  const [pages, setPages] = useState([React.createRef()]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [isErasing, setIsErasing] = useState(false);

  // Start drawing
  const startDrawing = (e, canvasRef) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  // Draw / Erase
  const draw = (e, canvasRef) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");

    ctx.strokeStyle = isErasing ? "white" : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Clear all pages
  const clearCanvas = () => {
    pages.forEach((ref) => {
      const canvas = ref.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  };

  // ➕ Add new page
  const addPage = () => {
    setPages([...pages, React.createRef()]);
  };

  // 📄 Save ALL pages as PDF
  const saveAsPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");

    pages.forEach((ref, index) => {
      const canvas = ref.current;
      const imgData = canvas.toDataURL("image/png");

      if (index !== 0) pdf.addPage();

      pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    });

    pdf.save("manga.pdf");
  };

  return (
    <div
      style={{
        padding: "20px",
        textAlign: "center",
        color: "white"
      }}
    >
      <h2>Draw Your Manga Pages 🎨</h2>

      {/* Toolbar */}
      <div style={{ marginBottom: "15px" }}>
        <input
          type="color"
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            setIsErasing(false);
          }}
        />

        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
        />

        <button onClick={clearCanvas}>Clear</button>

        <button onClick={() => setIsErasing(true)}>
          Eraser
        </button>

        <button onClick={saveAsPDF}>Save PDF</button>
      </div>

      {/* Pages */}
      {pages.map((canvasRef, index) => (
        <canvas
          key={index}
          ref={canvasRef}
          width={595}
          height={842} // A4 ratio
          style={{
            border: "2px solid white",
            background: "white",
            display: "block",
            margin: "20px auto"
          }}
          onMouseDown={(e) => startDrawing(e, canvasRef)}
          onMouseMove={(e) => draw(e, canvasRef)}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      ))}

      {/* ➕ Floating Add Page Button */}
      <button
        onClick={addPage}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "#15aee1",
          color: "white",
          fontSize: "30px",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 10px rgba(0,0,0,0.4)"
        }}
      >
        +
      </button>
    </div>
  );
};

export default PaintPage;
