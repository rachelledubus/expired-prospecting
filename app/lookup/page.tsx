"use client";

import { useState } from "react";

type Phone = {
  number: string;
  type: string;
  dnc: boolean;
  tcpa: boolean;
  carrier?: string;
  rank?: number;
};

type Email = {
  email: string;
  rank?: number;
};

type Person = {
  full_name: string;
  deceased: boolean;
  property_owner: boolean;
  litigator: boolean;
  mailing_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  phones: Phone[];
  emails: Email[];
};

type LookupResult = {
  hit: boolean;
  persons_count: number;
  credits_deducted: number;
  persons: Person[];
  meta: {
    request_id: string;
    timestamp: string;
  };
};

function formatPhone(number: string) {
  const digits = number.replace(/\D/g, "");
  if (digits.length !== 10) return number;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function LookupPage() {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

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
            result.persons.map((person, i) => (
              <div className="person-card" key={i}>
                <strong>{person.full_name}</strong>
                {person.deceased && <span className="badge bad">DECEASED</span>}
                {person.litigator && <span className="badge bad">LITIGATOR — DO NOT CONTACT</span>}
                {person.property_owner && <span className="badge ok">OWNER</span>}

                {person.mailing_address && (
                  <p className="muted" style={{ marginTop: 8 }}>
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
              </div>
            ))
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
