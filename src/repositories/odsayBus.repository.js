const ODSAY_BUS_STATION_INFO = "https://api.odsay.com/v1/api/busStationInfo";

export async function fetchBusStationInfo({ stationID }) {
  const apiKey = process.env.ODSAY_API_KEY;

  const params = new URLSearchParams({
    apiKey,
    stationID: String(stationID),
    lang: "0",
    output: "json",
  });

  const url = `${ODSAY_BUS_STATION_INFO}?${params.toString()}`;

  const resp = await fetch(url);
  const data = await resp.json();

  return { ok: resp.ok, status: resp.status, data };
}
