import { CustomError } from "../response/customError.js";

const ODSAY_SUBWAY_SCHEDULE_URL =
  "https://api.odsay.com/v1/api/searchSubwaySchedule";

/*
ODsay (신) 지하철역 전체 시간표 조회 API 호출
- stationID: 지하철역 ID (필수) 
- wayCode: 1(상행) / 2(하행) - 있으면 해당 방향만 조회, 없으면 양방향 모두 조회

반환: { ok, status, data }
- ok: fetch 응답 ok 여부 (HTTP 2xx)
- data: JSON 파싱 결과 (ODsay 특성상 HTTP 200이어도 data.error가 올 수 있음)
*/
export async function fetchSubwaySchedule({ stationID, wayCode }) {
  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) {
    throw new CustomError(
      "COM-500-001",
      "ODSAY_API_KEY is missing in env",
      "ODsay/searchSubwaySchedule",
    );
  }

  const params = new URLSearchParams({
    apiKey,
    stationID: String(stationID),
    output: "json",
  });

  // wayCode가 있으면 포함 (1:상행, 2:하행)
  if (wayCode === 1 || wayCode === 2) {
    params.set("wayCode", String(wayCode));
  }

  const resp = await fetch(`${ODSAY_SUBWAY_SCHEDULE_URL}?${params.toString()}`);
  const status = resp.status;

  let data = null;
  try {
    data = await resp.json();
  } catch (e) {
    data = null;
  }

  // 디버깅용
  // console.log("[ODsay][SubwaySchedule] raw:", JSON.stringify(data, null, 2));

  return { ok: resp.ok, status, data };
}
