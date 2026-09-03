const FULL_TOKEN = /^0x[a-fA-F0-9]{40}$/;

export const isTokenAddress = (value?: string | null) => Boolean(value && FULL_TOKEN.test(value.trim()));

export const gmgnTokenUrl = (address: string) =>
  `https://gmgn.ai/robinhood/token/${encodeURIComponent(address.trim())}`;

export const axiomTokenUrl = (address: string) =>
  `https://axiom.trade/t/${encodeURIComponent(address.trim())}?chain=robinhood`;
