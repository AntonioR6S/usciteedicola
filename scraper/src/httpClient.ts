const USER_AGENT =
  "Mozilla/5.0 (compatible; EdicolaTrackerBot/1.0; +personal use, tracks release dates)";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchHtml(url: string, delayMs = 400): Promise<string> {
  await sleep(delayMs);
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "it-IT,it;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  return res.text();
}
