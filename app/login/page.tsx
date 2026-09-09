"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Incorrect password");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="page">
      <div className="panel">
        <h1>Prospecting Portal</h1>
        <p className="muted">Private access only.</p>
        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginTop: 20 }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Checking..." : "Enter"}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
