export const shortAddr = (address: string) => {
  if (!address) return "????";
  if (address.includes("...")) return address;
  if (address.startsWith("pending:")) return address;
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const fmtEth = (value: number) => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(3)}`;
};

export const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const fmtMc = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "—";
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export const age = (iso: string | null) => {
  if (!iso) return "--";
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

export const pad = (value: string, width: number) => {
  const text = value.length > width ? `${value.slice(0, width - 1)}~` : value;
  return text.padEnd(width, " ");
};

export const padNum = (value: string, width: number) => value.padStart(width, " ");
