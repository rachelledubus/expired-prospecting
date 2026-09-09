export default function Dashboard() {
  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>Rachelle | Prospecting</h1>
          <p className="muted">What do you want to do?</p>
        </div>
        <form action="/api/logout" method="post">
          <button className="secondary" type="submit">
            Log out
          </button>
        </form>
      </div>

      <div className="grid-links">
        <a href="/lookup">🔎 Look up property</a>
        <a href="/import">📋 Import expired listings (CSV)</a>
      </div>
    </div>
  );
}
