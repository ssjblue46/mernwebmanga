import React, { useState } from "react";
import { jsPDF } from "jspdf";

const PaintPage = () => {
  const [pages, setPages] = useState([
    { id: Date.now(), ref: React.createRef(), history: [], redo: [] }
  ]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [eraserSize, setEraserSize] = useState(10);
  const [isErasing, setIsErasing] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
const brushPresets = {
  pencil: {
    name: "Pencil",
    size: 2,
    opacity: 1,
    effect: "normal"
  },
  marker: {
    name: "Marker",
    size: 8,
    opacity: 0.4,
    effect: "marker"
  },
  spray: {
    name: "Spray",
    size: 10,
    opacity: 0.3,
    effect: "spray"
  },
  calligraphy: {
    name: "Calligraphy",
    size: 6,
    opacity: 1,
    effect: "calligraphy"
  },
  dotted: {
    name: "Dotted",
    size: 4,
    opacity: 1,
    effect: "dotted"
  },
  rainbow: {
    name: "Rainbow",
    size: 5,
    opacity: 1,
    effect: "rainbow"
  }
};
  const [currentBrush, setCurrentBrush] = useState(brushPresets.pencil);
  const [hue, setHue] = useState(0);
  // 🧠 Save state
  const saveState = (ref, pageIndex) => {
    const canvas = ref.current;
    const data = canvas.toDataURL();

    setPages((prev) => {
      const updated = [...prev];
      updated[pageIndex].history.push(data);
      updated[pageIndex].redo = [];
      return updated;
    });
  };

  // 🎨 Start Drawing
  const startDrawing = (e, ref, index) => {
    const canvas = ref.current;
    const rect = canvas.getBoundingClientRect();

    const x = e.touches
      ? e.touches[0].clientX - rect.left
      : e.nativeEvent.offsetX;

    const y = e.touches
      ? e.touches[0].clientY - rect.top
      : e.nativeEvent.offsetY;

    saveState(ref, index);

    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e, ref) => {
  if (!isDrawing) return;

  const canvas = ref.current;
  const rect = canvas.getBoundingClientRect();

  const x = e.touches
    ? e.touches[0].clientX - rect.left
    : e.nativeEvent.offsetX;

  const y = e.touches
    ? e.touches[0].clientY - rect.top
    : e.nativeEvent.offsetY;

  const ctx = canvas.getContext("2d");

  ctx.globalCompositeOperation = isErasing
    ? "destination-out"
    : "source-over";

  ctx.lineWidth = isErasing ? eraserSize : currentBrush.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = currentBrush.opacity;

  // RESET things each frame
  ctx.shadowBlur = 0;
  ctx.setLineDash([]);

  // 🎨 EFFECTS
  switch (currentBrush.effect) {

    // ✏️ Pencil
    case "normal":
      ctx.strokeStyle = color;
      break;

    // 🖊 Marker (thick + smooth)
    case "marker":
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = currentBrush.size / 2;
      break;

    // ✒️ Calligraphy (angled stroke)
    case "calligraphy":
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 6);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, currentBrush.size, 2);
      ctx.restore();
      return;

    // ⚫ Dotted
    case "dotted":
      ctx.strokeStyle = color;
      ctx.setLineDash([currentBrush.size * 2, currentBrush.size * 2]);
      break;

    // 🌈 Rainbow (FIXED)
    case "rainbow":
      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      setHue((prev) => (prev + 2) % 360);
      break;

    // 💨 Spray
    case "spray":
      ctx.fillStyle = color;
      for (let i = 0; i < currentBrush.size * 2; i++) {
        const offsetX = Math.random() * currentBrush.size - currentBrush.size / 2;
        const offsetY = Math.random() * currentBrush.size - currentBrush.size / 2;
        ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
      }
      return;

    default:
      ctx.strokeStyle = color;
  }

  ctx.lineTo(x, y);
  ctx.stroke();
};


  const stopDrawing = () => setIsDrawing(false);

  // 🧠 Undo
  const undo = (index) => {
    const page = pages[index];
    if (page.history.length === 0) return;

    const last = page.history.pop();
    page.redo.push(page.ref.current.toDataURL());

    const img = new Image();
    img.src = last;
    img.onload = () => {
      const ctx = page.ref.current.getContext("2d");
      ctx.clearRect(0, 0, 595, 842);
      ctx.drawImage(img, 0, 0);
    };

    setPages([...pages]);
  };

  // 🧠 Redo
  const redo = (index) => {
    const page = pages[index];
    if (page.redo.length === 0) return;

    const next = page.redo.pop();
    page.history.push(page.ref.current.toDataURL());

    const img = new Image();
    img.src = next;
    img.onload = () => {
      const ctx = page.ref.current.getContext("2d");
      ctx.clearRect(0, 0, 595, 842);
      ctx.drawImage(img, 0, 0);
    };

    setPages([...pages]);
  };

  // ➕ Add Page
  const addPage = () => {
    setPages([
      ...pages,
      { id: Date.now(), ref: React.createRef(), history: [], redo: [] }
    ]);
  };

  // ➖ Remove Page
  const removePage = () => {
    if (pages.length <= 1) return;
    setPages(pages.slice(0, -1));
  };

  // 🔀 Reorder Pages
  const handleDrop = (index) => {
    const updated = [...pages];
    const dragged = updated.splice(dragIndex, 1)[0];
    updated.splice(index, 0, dragged);
    setPages(updated);
  };

  // 📄 Save PDF
  const saveAsPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");

    pages.forEach(({ ref }, i) => {
      const img = ref.current.toDataURL("image/png");
      if (i !== 0) pdf.addPage();
      pdf.addImage(img, "PNG", 0, 0, 210, 297);
    });

    pdf.save("manga.pdf");
  };

  return (
    <div style={{ display: "flex", color: "white" }}>

      {/* 📦 Sidebar */}
      <div style={{
        width: "120px",
        borderRight: "2px solid #333",
        padding: "10px",
        textAlign: "center"
      }}>
        <h4>Pages</h4>

        {pages.map((page, index) => (
          <div
            key={page.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            style={{
              margin: "10px 0",
              padding: "10px",
              background: "#15aee1",
              borderRadius: "8px",
              cursor: "grab",
              fontWeight: "bold"
            }}
          >
            {index + 1}
          </div>
        ))}

        <button
    onClick={addPage}
    style={{
      width: "50px",
      height: "50px",
      fontSize: "28px",
      borderRadius: "12px",
      border: "none",
      background: "#15aee1",
      color: "white",
      cursor: "pointer",
      marginBottom: "10px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.4)"
    }}
  >+</button>
        <button
    onClick={removePage}
    style={{
      width: "50px",
      height: "50px",
      fontSize: "28px",
      borderRadius: "12px",
      border: "none",
      background: "#ff4444",
      color: "white",
      cursor: "pointer",
      boxShadow: "0 4px 10px rgba(0,0,0,0.4)"
    }}
  >-</button>
      </div>

      {/* 🎨 Main */}
      <div style={{ flex: 1, textAlign: "center", padding: "20px" }}>
        <h2>Draw Manga 🎨</h2>

        {/* Toolbar */}
        <div>
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setIsErasing(false);
            }}
          />

          <div>
            Brush
            <input
              type="range"
              min="1"
              max="20"
              value={currentBrush.size}
              onChange={(e) =>
  setCurrentBrush({
    ...currentBrush,
    size: Number(e.target.value)
  })
}
            />
          </div>

          <div>
            Eraser
            <input
              type="range"
              min="5"
              max="50"
              value={eraserSize}
              onChange={(e) => setEraserSize(Number(e.target.value))}
            />
          </div>

          <button className="nav-style-btn" onClick={() => setIsErasing(false)}> 🖌 Brush </button>
          <button className="nav-style-btn" onClick={() => setIsErasing(true)}>🧽 Eraser </button>
                <div>
  {Object.keys(brushPresets).map((key) => (
    <button
      key={key}
      onClick={() => {
        setCurrentBrush(brushPresets[key]);
        setIsErasing(false);
      }}
    >
      {brushPresets[key].name}
    </button>
  ))}
</div>
          <button className="nav-style-btn" onClick={saveAsPDF}>📄 Save PDF </button>
        </div>

        {/* Canvas Pages */}
        {pages.map(({ ref, id }, index) => (
          <div key={id}>
            <div>
              <button className="nav-style-btn" onClick={() => undo(index)}>
  ↩ Undo
</button>

<button className="nav-style-btn" onClick={() => redo(index)}>
  ↪ Redo
</button>
            </div>

            <canvas
              ref={ref}
              width={595}
              height={842}
              style={{
                border: "2px solid white",
                background: "white",
                margin: "20px auto",
                display: "block",
                touchAction: "none"
              }}
              onMouseDown={(e) => startDrawing(e, ref, index)}
              onMouseMove={(e) => draw(e, ref)}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={(e) => startDrawing(e, ref, index)}
              onTouchMove={(e) => draw(e, ref)}
              onTouchEnd={stopDrawing}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaintPage;
