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

      <div className="section-label">Daily safety gate</div>
      <a className="action-card" href="/status-refresh">
        <div className="action-title">1. Refresh Backlog Market Status</div>
        <div className="muted">Before working an older expired backlog, upload today&apos;s Current Market Status CSV so relisted properties are blocked automatically.</div>
        <div className="fed-by">
          Fed by Matrix saved search: <span className="tag">✓ PROSPECTING — CURRENT MARKET STATUS</span>
          <span className="tag">$0 Tracerfy spend</span>
        </div>
      </a>

      <div className="section-label">New intake</div>
      <a className="action-card" href="/intake">
        <div className="action-title">2. Process MLS Exports</div>
        <div className="muted">Drop your Matrix CSV exports in one place. The portal recognizes, validates, decodes, and routes them automatically.</div>
        <div className="fed-by">
          Fed by Matrix saved searches: <span className="tag">🔥 New Expireds</span>
          <span className="tag">💰 High-Value Expireds</span>
          <span className="tag">✓ Current Market Status</span>
          <span className="tag">Active</span>
          <span className="tag">New</span>
          <span className="tag">Closed</span>
        </div>
      </a>

      <a className="action-card" href="/import" style={{ marginTop: 12 }}>
        <div className="action-title">3. Advanced Expired Processing</div>
        <div className="muted">Direct access to the existing Tracerfy, compliance, and Notion workflow.</div>
      </a>

      <div className="section-label">Weekly</div>
      <a className="action-card" href="/watchlist">
        <div className="action-title">4. Send Research Candidates</div>
        <div className="muted">Upload selected Price Reduction / Stale listings</div>
        <div className="fed-by">
          Fed by Matrix saved searches: <span className="tag">📉 Price Reductions</span>
          <span className="tag">⏳ Stale Listings</span>
        </div>
      </a>

      <div className="section-label">Anytime</div>
      <a className="action-card" href="/lookup">
        <div className="action-title">5. Look Up One Property</div>
        <div className="muted">Manual single-address skip trace — no CSV needed</div>
      </a>
    </div>
  );
}
