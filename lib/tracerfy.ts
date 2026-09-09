export type Phone = {
  number: string;
  type: string;
  dnc: boolean;
  tcpa: boolean;
  carrier?: string;
  rank?: number;
};

export type Email = {
  email: string;
  rank?: number;
};

export type Person = {
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

export type LookupResult = {
  address: string;
  city: string;
  state: string;
  zip: string;
  hit: boolean;
  persons_count: number;
  credits_deducted: number;
  persons: Person[];
  meta?: {
    request_id: string;
    timestamp: string;
  };
};

export function formatPhone(number: string) {
  const digits = number.replace(/\D/g, "");
  if (digits.length !== 10) return number;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Outreach eligibility per person, derived from Tracerfy's own DNC/TCPA/litigator
 * flags. A litigator record is suppressed entirely. Otherwise: any clean phone
 * allows calling; a mailing address always allows mail unless suppressed.
 */
export function outreachEligibility(person: Person): string[] {
  if (person.litigator || person.deceased) return ["None"];

  const hasCallablePhone = person.phones?.some((p) => !p.dnc && !p.tcpa);
  const hasMailAddress = Boolean(person.mailing_address?.street);

  const eligibility: string[] = [];
  if (hasCallablePhone) eligibility.push("Call");
  if (hasMailAddress) eligibility.push("Mail");
  return eligibility.length > 0 ? eligibility : ["None"];
}

export function dncStatus(person: Person): "Clear" | "Listed" | "Not Checked" {
  if (!person.phones || person.phones.length === 0) return "Not Checked";
  return person.phones.some((p) => p.dnc) ? "Listed" : "Clear";
}

export function bestPhone(person: Person): string | undefined {
  const clean = person.phones?.find((p) => !p.dnc && !p.tcpa);
  return (clean ?? person.phones?.[0])?.number;
}

export function bestEmail(person: Person): string | undefined {
  return person.emails?.[0]?.email;
}
