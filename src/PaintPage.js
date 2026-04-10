import React, { useRef, useState } from "react";

const PaintPage = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);

  const startDrawing = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveImage = () => {
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
  <div
    style={{
      padding: "20px",
      textAlign: "center",
      color: "white" // 👈 IMPORTANT (text visible on dark bg)
    }}
  >
    <h2>Draw Your Manga Page 🎨</h2>

    {/* Toolbar */}
    <div style={{ marginBottom: "10px" }}>
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />

      <input
        type="range"
        min="1"
        max="20"
        value={brushSize}
        onChange={(e) => setBrushSize(e.target.value)}
      />

      <button onClick={clearCanvas}>Clear</button>
      <button onClick={saveImage}>Save</button>
    </div>

    {/* Canvas */}
    <canvas
      ref={canvasRef}
      width={800}
      height={1000}
      style={{
        border: "2px solid white",   // 👈 visible border
        background: "white",
        display: "block",
        margin: "0 auto"             // 👈 center it
      }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  </div>
);
};

export default PaintPage;
