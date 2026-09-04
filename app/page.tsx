export default function Home() {
  return (
    <main className="shell">
      <section className="card" aria-labelledby="canvas-title">
        <p className="eyebrow">SOVEREIGN X</p>
        <h1 id="canvas-title">Canvas is ready.</h1>
        <p className="lede">
          Each request gets its own <code>comm/&lt;8hex&gt;</code> branch and a live preview URL.
          The control plane and all credentials stay outside this public project.
        </p>
        <div className="status"><span aria-hidden="true" /> Ready for the next build</div>
      </section>
    </main>
  );
}
