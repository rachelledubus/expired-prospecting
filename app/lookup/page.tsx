"use client";

import { useState } from "react";
import { formatPhone, outreachEligibility, dncStatus, type LookupResult, type Person } from "@/lib/tracerfy";

export default function LookupPage() {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [pushStatus, setPushStatus] = useState<Record<number, "loading" | "done" | "error">>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setPushStatus({});

    try {
      const res = await fetch("/api/property-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, city, state, zip }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Lookup failed.");
        return;
      }

      setResult(data);
    } catch {
      setError("Something went wrong reaching the lookup service.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePushToNotion(person: Person, index: number) {
    if (!result) return;
    setPushStatus((prev) => ({ ...prev, [index]: "loading" }));
    try {
      const res = await fetch("/api/notion-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person,
          address,
          city,
          state,
          zip,
          requestId: result.meta?.request_id,
          timestamp: result.meta?.timestamp,
        }),
      });
      if (!res.ok) throw new Error();
      setPushStatus((prev) => ({ ...prev, [index]: "done" }));
    } catch {
      setPushStatus((prev) => ({ ...prev, [index]: "error" }));
    }
  }

  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>Property Lookup</h1>
          <p className="muted">Address, city, state, and zip are all required.</p>
        </div>
        <a href="/">&larr; Dashboard</a>
      </div>

      <div className="panel">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="address">Address</label>
            <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="state">State</label>
            <input
              id="state"
              value={state}
              maxLength={2}
              onChange={(e) => setState(e.target.value.toUpperCase())}
            />
          </div>
          <div className="field">
            <label htmlFor="zip">Zip</label>
            <input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search property"}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>

      {result && (
        <div style={{ marginTop: 20 }}>
          {!result.hit || result.persons_count === 0 ? (
            <div className="panel">
              <p>No owner/contact records found for this address.</p>
            </div>
          ) : (
            result.persons.map((person, i) => {
              const status = pushStatus[i];
              return (
                <div className="person-card" key={i}>
                  <strong>{person.full_name}</strong>
                  {person.deceased && <span className="badge bad">DECEASED</span>}
                  {person.litigator && <span className="badge bad">LITIGATOR — DO NOT CONTACT</span>}
                  {person.property_owner && <span className="badge ok">OWNER</span>}

                  <p className="muted" style={{ marginTop: 6 }}>
                    DNC: {dncStatus(person)} · Eligible for: {outreachEligibility(person).join(", ")}
                  </p>

                  {person.mailing_address && (
                    <p className="muted" style={{ marginTop: 4 }}>
                      Mailing: {person.mailing_address.street}, {person.mailing_address.city}{" "}
                      {person.mailing_address.state} {person.mailing_address.zip}
                    </p>
                  )}

                  {person.phones?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      {person.phones.map((phone, j) => (
                        <div className="phone-row" key={j}>
                          <span>{formatPhone(phone.number)}</span>
                          <span className="muted">{phone.type}</span>
                          {phone.dnc ? (
                            <span className="badge bad">DNC</span>
                          ) : (
                            <span className="badge ok">NOT ON DNC</span>
                          )}
                          {phone.tcpa && <span className="badge warn">TCPA FLAG</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {person.emails?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      {person.emails.map((email, k) => (
                        <div key={k} className="muted">
                          {email.email}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: 10 }}>
                    <button
                      className="secondary"
                      disabled={status === "loading" || status === "done"}
                      onClick={() => handlePushToNotion(person, i)}
                    >
                      {status === "done" ? "Added to CRM" : status === "loading" ? "Adding..." : "Add to Notion"}
                    </button>
                    {status === "error" && <span className="error"> Failed — try again.</span>}
                  </div>
                </div>
              );
            })
          )}

          <p className="meta">
            Checked {result.credits_deducted} credit(s) · request {result.meta?.request_id} ·{" "}
            {result.meta?.timestamp}
          </p>
        </div>
      )}
    </div>
  );
}
