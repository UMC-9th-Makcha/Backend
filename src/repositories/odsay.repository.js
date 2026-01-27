const ODSAY_BASE = "https://api.odsay.com/v1/api/searchPubTransPathT";

export async function fetchPubTransPath({ sx, sy, ex, ey }) {
  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) throw new Error("ODSAY_API_KEY is missing in env");

  const params = new URLSearchParams({
    apiKey,
    SX: String(sx),
    SY: String(sy),
    EX: String(ex),
    EY: String(ey),
    OPT: "0",
    // SearchType: "0",
    SearchPathType: "0",
    output: "json",
  });

  const url = `${ODSAY_BASE}?${params.toString()}`;
  console.log("[ODsay] request url:", url);

  const resp = await fetch(url);
  const data = await resp.json();

  console.log("[ODsay] raw response:", JSON.stringify(data, null, 2));

  return { ok: resp.ok, status: resp.status, data };
}
