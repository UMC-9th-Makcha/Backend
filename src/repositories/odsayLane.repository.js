import axios from "axios";

const ODSAY_BASE = "https://api.odsay.com/v1/api";
const API_KEY = process.env.ODSAY_API_KEY;

export async function fetchLoadLane({ mapObject, lang = 0 }) {
  const url = `${ODSAY_BASE}/loadLane`;

  const { data, status } = await axios.get(url, {
    params: { apiKey: API_KEY, lang, mapObject },
    timeout: 8000,
  });

  return { ok: status >= 200 && status < 300, status, data };
}
