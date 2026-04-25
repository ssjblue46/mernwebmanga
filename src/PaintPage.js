import React, { useState } from "react";
import { jsPDF } from "jspdf";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

    // 🔥 REAL ERASER
    ctx.globalCompositeOperation = isErasing
      ? "destination-out"
      : "source-over";

    ctx.strokeStyle = color;
    ctx.lineWidth = isErasing ? eraserSize : brushSize;
    ctx.lineCap = "round";

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
      ctx.drawImage(img, 0, 0, 595, 842);
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
      ctx.drawImage(img, 0, 0, 595, 842);
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

  // 📥 Upload PDF (MAIN FEATURE)
  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async function () {
      const typedArray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument(typedArray).promise;

      const newPages = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });

        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");

        tempCanvas.width = 595;
        tempCanvas.height = 842;

        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;

        const imgData = tempCanvas.toDataURL();

        newPages.push({
          id: Date.now() + i,
          ref: React.createRef(),
          history: [],
          redo: [],
          imgData,
          initialized: false
        });
      }

      setPages(newPages);
    };

    reader.readAsArrayBuffer(file);
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

        <button onClick={addPage}>+</button>
        <button onClick={removePage}>-</button>
      </div>

      {/* 🎨 Main */}
      <div style={{ flex: 1, textAlign: "center", padding: "20px" }}>
        <h2>Draw Manga 🎨</h2>

        {/* Toolbar */}
        <div>
          <input type="file" accept="application/pdf" onChange={handlePDFUpload} />

          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setIsErasing(false);
            }}
          />

          <button onClick={() => setIsErasing(false)}>🖌 Brush</button>
          <button onClick={() => setIsErasing(true)}>🧽 Eraser</button>
          <button onClick={saveAsPDF}>📄 Save PDF</button>
        </div>

        {/* Canvas */}
        {pages.map((page, index) => (
          <div key={page.id}>
            <button onClick={() => undo(index)}>Undo</button>
            <button onClick={() => redo(index)}>Redo</button>

            <canvas
              ref={(canvas) => {
                if (!canvas) return;
                page.ref.current = canvas;

                if (page.imgData && !page.initialized) {
                  const ctx = canvas.getContext("2d");
                  const img = new Image();

                  img.src = page.imgData;
                  img.onload = () => {
                    ctx.drawImage(img, 0, 0, 595, 842);

                    // 🔥 Save as base state
                    const base = canvas.toDataURL();
                    page.history.push(base);

                    page.initialized = true;
                  };
                }
              }}
              width={595}
              height={842}
              style={{ border: "2px solid white", background: "white", margin: "20px auto" }}
              onMouseDown={(e) => startDrawing(e, page.ref, index)}
              onMouseMove={(e) => draw(e, page.ref)}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaintPage;
