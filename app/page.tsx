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

      <div className="section-label">Today</div>
      <a className="action-card" href="/import">
        <div className="action-title">1. Process Expireds</div>
        <div className="muted">Upload expireds + one fresh market-live export. Relisted properties are filtered out before skip tracing.</div>
        <div className="fed-by">
          Fed by Matrix saved searches: <span className="tag">🔥 New Expireds</span>
          <span className="tag">💰 High-Value Expireds</span>
          <span className="tag">✓ Current Market Status</span>
        </div>
      </a>

      <div className="section-label">Weekly</div>
      <a className="action-card" href="/watchlist">
        <div className="action-title">2. Send Research Candidates</div>
        <div className="muted">Upload selected Price Reduction / Stale listings</div>
        <div className="fed-by">
          Fed by Matrix saved searches: <span className="tag">📉 Price Reductions</span>
          <span className="tag">⏳ Stale Listings</span>
        </div>
      </a>

      <div className="section-label">Anytime</div>
      <a className="action-card" href="/lookup">
        <div className="action-title">3. Look Up One Property</div>
        <div className="muted">Manual single-address skip trace — no CSV needed</div>
      </a>
    </div>
  );
}
