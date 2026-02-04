import axios from "axios";

const ODSAY_BASE = "https://api.odsay.com/v1/api";
const API_KEY = process.env.ODSAY_API_KEY;

export async function fetchLoadLane({ mapObject, lang = 0 }) {
  const url = (
    `${ODSAY_BASE}/loadLane` +
    `?apiKey=${encodeURIComponent(API_KEY)}` +
    `&lang=${lang}` +
    `&output=json` +
    `&mapObject=${mapObject}`
  ).trim();

  console.log("[odsay][loadLane] url =", JSON.stringify(url));

  try {
    const res = await axios.get(url, {
      timeout: 8000,
      responseType: "text",
      transformResponse: [(d) => d],
    });

    console.log("[odsay][loadLane] status =", res.status);
    console.log(
      "[odsay][loadLane] body(head) =",
      typeof res.data === "string" ? res.data.slice(0, 200) : res.data,
    );

    // JSON이면 파싱
    let data = res.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        // JSON이 아니면 그대로 둠
      }
    }

    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      data,
    };
  } catch (e) {
    const status = e?.response?.status ?? 0;
    const raw = e?.response?.data ?? null;

    console.log("[odsay][loadLane][fail] status =", status);
    console.log(
      "[odsay][loadLane][fail] body(head) =",
      typeof raw === "string" ? raw.slice(0, 200) : raw,
    );

    let data = raw;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {}
    }

    return { ok: false, status, data };
  }
}
