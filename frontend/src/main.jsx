import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const fallbackVideos = [
  { id: "f1-demo", title: "GP de Monza - Vuelta rápida", description: "Rendimiento en pista, neumáticos y puntos críticos.", category: "f1", platform: "youtube", videoUrl: "https://www.youtube-nocookie.com/embed/5SjWpXMij2M", heartCount: 0 },
  { id: "gta-demo", title: "Cayo Perico - Ruta sigilosa", description: "Estrategia y botín en solitario.", category: "gta", platform: "youtube", videoUrl: "https://www.youtube-nocookie.com/embed/ywAO794LlZ0", heartCount: 0 },
  { id: "retro-demo", title: "Joyas retro 16-bits", description: "Clásicos de plataformas y velocidad.", category: "random", platform: "youtube", videoUrl: "https://www.youtube-nocookie.com/embed/WY5JW-jYFNs", heartCount: 0 },
];

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/"><span className="brand-mark">SF</span><span>STEELFIRE<em>9239</em></span></Link>
        <nav className="topnav"><a href="/#f1">F1</a><a href="/#gta">GTA V</a><a href="/#random">Random</a><Link to="/bunker">El Búnker</Link></nav>
      </header>
      {children}
    </div>
  );
}

function HeartButton({ video, onUpdate }) {
  const [busy, setBusy] = React.useState(false);
  const [liked, setLiked] = React.useState(() => localStorage.getItem(`heart:${video.id}`) === "1");

  async function giveHeart() {
    if (liked || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/api/videos/${video.id}/heart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: localStorage.getItem("sf-visitor") }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      localStorage.setItem(`heart:${video.id}`, "1");
      setLiked(true);
      onUpdate(data.heartCount);
    } catch {
      setLiked(true);
      onUpdate((video.heartCount || 0) + 1);
    } finally {
      setBusy(false);
    }
  }

  return <button className={`heart-button ${liked ? "liked" : ""}`} onClick={giveHeart} disabled={liked || busy}><span>♥</span> {video.heartCount || 0}</button>;
}

function CommentBox({ video }) {
  const [text, setText] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [comments, setComments] = React.useState([]);

  React.useEffect(() => {
    fetch(`${API_URL}/api/videos/${video.id}/comments`)
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]));
  }, [video.id]);

  async function submit(event) {
    event.preventDefault();
    const cleaned = text.trim();
    if (!cleaned) return;
    try {
      const response = await fetch(`${API_URL}/api/videos/${video.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleaned, visitorId: localStorage.getItem("sf-visitor") }),
      });
      if (!response.ok) throw new Error();
      setText("");
      setMessage("Comentario enviado a revisión");
    } catch {
      setMessage("No se pudo enviar el comentario");
    }
  }

  return (
    <form className="comment-form" onSubmit={submit}>
      <label htmlFor={`comment-${video.id}`}>Comentario corto</label>
      <div><input id={`comment-${video.id}`} value={text} onChange={(event) => setText(event.target.value)} maxLength={120} placeholder="Máximo 120 caracteres" /><button type="submit">Enviar</button></div>
      {message && <p className="form-message">{message}</p>}
      {comments.length > 0 && (
        <div className="approved-comments">
          {comments.map((comment) => <p key={comment.id || comment._id}>{comment.text}</p>)}
        </div>
      )}
    </form>
  );
}

function VideoCard({ video, onUpdate }) {
  let embedUrl = video.videoUrl || "";
  if (embedUrl.includes("<iframe")) {
    const match = embedUrl.match(/src=["']([^"']+)["']/);
    embedUrl = match?.[1] || "";
  }
  return (
    <article className={`video-card zone-${video.category}`}>
      {embedUrl ? <div className="video-frame"><iframe src={embedUrl} title={video.title} allowFullScreen /></div> : <div className="video-placeholder">Próximo video</div>}
      <div className="video-content">
        <span className="category-tag">{video.category === "f1" ? "F1" : video.category === "gta" ? "GTA V" : "Random"}</span>
        <h3>{video.title}</h3><p>{video.description}</p>
        <div className="video-actions"><HeartButton video={video} onUpdate={(count) => onUpdate(video.id, count)} /></div>
        <CommentBox video={video} />
      </div>
    </article>
  );
}

function PublicSite() {
  const [videos, setVideos] = React.useState(fallbackVideos);
  const [live, setLive] = React.useState(false);

  React.useEffect(() => {
    let visitorId = localStorage.getItem("sf-visitor");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("sf-visitor", visitorId);
    }
    fetch(`${API_URL}/api/videos`).then((response) => response.ok ? response.json() : fallbackVideos).then((data) => setVideos(Array.isArray(data) ? data : fallbackVideos)).catch(() => setVideos(fallbackVideos));
    fetch(`${API_URL}/api/twitch/status`).then((response) => response.ok ? response.json() : { live: false }).then((data) => setLive(Boolean(data.live))).catch(() => setLive(false));
  }, []);

  function updateHeart(id, count) {
    setVideos((current) => current.map((video) => video.id === id ? { ...video, heartCount: count } : video));
  }

  const sections = [
    ["f1", "Formula 1", "Telemetría y carreras", "banner-f1.jpg"],
    ["gta", "GTA V", "Los Santos y misiones", "banner-gtav.jpg"],
    ["random", "Retro & Random", "Clásicos y juegos variados", "banner-GamingZone.jpg"],
  ];

  return (
    <AppShell>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className={`live-status ${live ? "online" : ""}`}><i /> {live ? "EN VIVO" : "OFFLINE"}</span>
            <p className="eyebrow">Central gamer de SteelFire</p>
            <h1>CARRERAS.<br /><span>COMUNIDAD.</span></h1>
            <p>F1, GTA V y juegos retro en una sola zona.</p>
            <div className="hero-actions"><a className="primary-action" href={live ? "https://www.twitch.tv/steelfire_9239" : "/#f1"} target={live ? "_blank" : undefined}>{live ? "Ver transmisión" : "Explorar videos"}</a><a className="secondary-action" href="https://www.youtube.com/channel/UCQkv2i9qeINOIYHtOXZ2_ZQ" target="_blank">YouTube</a></div>
          </div>
          <div className="hero-emblem"><span>SF</span></div>
        </section>
        {sections.map(([key, title, subtitle, banner]) => (
          <section className={`content-zone zone-${key}`} id={key} key={key}>
            <img className="zone-banner" src={`/img/${banner}`} alt="" />
            <div className="zone-heading"><div><p>Zona SteelFire</p><h2>{title}</h2><span>{subtitle}</span></div></div>
            <div className="video-grid">{videos.filter((video) => video.category === key).map((video) => <VideoCard key={video.id} video={video} onUpdate={updateHeart} />)}</div>
          </section>
        ))}
      </main>
    </AppShell>
  );
}

function BunkerLogin({ onLogin }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    const response = await fetch(`${API_URL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Acceso denegado"); return; }
    localStorage.setItem("sf-bunker-token", data.token);
    onLogin(data.token);
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <span className="login-lock">◆</span><p className="eyebrow">Acceso privado</p><h1>EL BÚNKER</h1>
        <label>Correo<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        {error && <p className="form-error">{error}</p>}<button type="submit">Entrar al Búnker</button>
      </form>
    </main>
  );
}

function Bunker() {
  const [token, setToken] = React.useState(() => localStorage.getItem("sf-bunker-token"));
  const navigate = useNavigate();
  const [videos, setVideos] = React.useState([]);
  const [comments, setComments] = React.useState([]);
  const [form, setForm] = React.useState({ title: "", description: "", category: "f1", platform: "youtube", videoUrl: "" });
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  async function load() {
    if (!token) return;
    try {
      const [videoResponse, commentResponse] = await Promise.all([
        fetch(`${API_URL}/api/videos`, { headers }),
        fetch(`${API_URL}/api/comments`, { headers }),
      ]);
      if (videoResponse.status === 401 || commentResponse.status === 401) {
        localStorage.removeItem("sf-bunker-token");
        setToken(null);
        return;
      }
      setVideos(await videoResponse.json());
      setComments(await commentResponse.json());
    } catch {
      setVideos([]);
    }
  }

  React.useEffect(() => { load(); }, [token]);

  async function saveVideo(event) {
    event.preventDefault();
    const response = await fetch(`${API_URL}/api/videos`, { method: "POST", headers, body: JSON.stringify(form) });
    if (response.ok) {
      setForm({ title: "", description: "", category: "f1", platform: "youtube", videoUrl: "" });
      load();
    }
  }

  async function deleteVideo(id) {
    await fetch(`${API_URL}/api/videos/${id}`, { method: "DELETE", headers });
    load();
  }

  async function moderateComment(id, status) {
    await fetch(`${API_URL}/api/comments/${id}`, { method: "PATCH", headers, body: JSON.stringify({ status }) });
    load();
  }

  function logout() {
    localStorage.removeItem("sf-bunker-token");
    setToken(null);
    navigate("/");
  }

  if (!token) return <BunkerLogin onLogin={setToken} />;

  return (
    <AppShell>
      <main className="bunker-page">
        <aside className="bunker-sidebar"><span className="login-lock">◆</span><h2>EL BÚNKER</h2><button onClick={logout}>Cerrar sesión</button></aside>
        <section className="bunker-main">
          <div className="bunker-heading"><div><p>Panel privado</p><h1>Control de contenido</h1></div><span className="live-status">Sistema listo</span></div>
          <div className="bunker-grid">
            <form className="admin-card" onSubmit={saveVideo}>
              <h2>Nuevo video</h2>
              <label>Título<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
              <label>Descripción<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></label>
              <div className="form-row">
                <label>Categoría<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="f1">F1</option><option value="gta">GTA V</option><option value="random">Random</option></select></label>
                <label>Plataforma<select value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })}><option value="youtube">YouTube</option><option value="twitch">Twitch</option></select></label>
              </div>
              <label>URL del video o iframe<input value={form.videoUrl} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })} required /></label>
              <button type="submit">Publicar video</button>
            </form>
            <section className="admin-card">
              <h2>Comentarios pendientes</h2>
              {comments.length === 0 ? <p className="empty-state">No hay comentarios para moderar.</p> : comments.map((comment) => (
                <div className="comment-row" key={comment.id || comment._id}>
                  <p>{comment.text}</p>
                  <button onClick={() => moderateComment(comment.id || comment._id, "approved")}>Aprobar</button>
                  <button className="danger" onClick={() => moderateComment(comment.id || comment._id, "rejected")}>Ocultar</button>
                </div>
              ))}
            </section>
            <section className="admin-card full-width">
              <h2>Videos publicados</h2>
              {videos.length === 0 ? <p className="empty-state">Aún no hay publicaciones en MongoDB.</p> : videos.map((video) => (
                <div className="video-row" key={video.id || video._id}>
                  <div><strong>{video.title}</strong><span>{video.category} · {video.platform} · ♥ {video.heartCount || 0}</span></div>
                  <button className="danger" onClick={() => deleteVideo(video.id || video._id)}>Eliminar</button>
                </div>
              ))}
            </section>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicSite />} />
        <Route path="/bunker" element={<Bunker />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
