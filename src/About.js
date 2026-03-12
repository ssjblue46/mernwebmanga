import React from "react";

function About() {
  return (
    <div className="page" style={{ textAlign: "center" }}>
      <h2>About Me</h2>

      {/* Profile Image */}
      <img
        src="/MyPhoto.jpg"
        alt="Raj Tamboskar"
        style={{
          width: "180px",
          height: "180px",
          borderRadius: "50%",
          objectFit: "cover",
          marginBottom: "20px",
          border: "3px solid #15aee1",
          boxShadow: "0 0 20px #15aee1",
        }}
      />

      {/* Bio Text */}
      <p>
        Hi, I’m <strong>Raj Tamboskar</strong>, a third-year BSc Computer Science
        student. I am currently building a <strong>digital comic website</strong>{" "}
        where I upload comics exclusively made by me.
      </p>
      <p>
        The project uses the <strong>MERN stack</strong>. MongoDB stores user data
        for sign-up and login, while React, Node.js, and Express power the frontend
        and backend.
      </p>
      <p>
        I enjoy creating art, coding, and bringing both together in web projects.
        This website is my way of sharing comics digitally with a modern, user-friendly
        platform.
      </p>
      <button><a href="https://ssjblue46-v0-manga-creation-app.vercel.app/">Go to Manga Creator App </a></button>
      {/* Social Icons */}
      <div
        style={{
          marginTop: "30px",
          display: "flex",
          justifyContent: "center",
          gap: "20px",
        }}
      >

        {/* YouTube */}
        <a href="https://m.youtube.com/@Raj_Tamboskar/" target="_blank" rel="noopener noreferrer">
          <img
            src="/YouTube.png"
            alt="YouTube"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              transition: "0.3s",
              boxShadow: "0 0 10px #15aee1",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.2)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          />
        </a>

        {/* Instagram */}
        <a href="https://www.instagram.com/raj_tamboskar/" target="_blank" rel="noopener noreferrer">
          <img
            src="/Instagram.jpg"
            alt="Instagram"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              transition: "0.3s",
              boxShadow: "0 0 10px #15aee1",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.2)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          />
        </a>

        {/* Gmail */}
        <a href="https://www.chess.com/member/ssjblue47" target="_blank" rel="noopener noreferrer">
          <img
            src="/Chess.png"
            alt="Chess"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              transition: "0.3s",
              boxShadow: "0 0 10px #15aee1",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.2)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          />
        </a>
      </div>
    </div>
  );
}

export default About;

