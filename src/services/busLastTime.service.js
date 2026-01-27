import { fetchBusStationInfo } from "../repositories/odsayBus.repository.js";

export async function getBusLastTimeAtStation({ stationID, busNo }) {
  const { ok, status, data } = await fetchBusStationInfo({ stationID });

  if (!ok) {
    throw new Error(
      `ODsay busStationInfo HTTP error: status=${status}, body=${JSON.stringify(
        data
      )}`
    );
  }
  if (data?.error) {
    throw new Error(
      `ODsay busStationInfo API error: ${JSON.stringify(data.error)}`
    );
  }

  const lanes = data?.result?.lane;
  if (!Array.isArray(lanes)) {
    throw new Error(
      `ODsay busStationInfo invalid response: ${JSON.stringify(data)}`
    );
  }

  // busNo로 매칭
  const matched = lanes.find(
    (l) => (l.busNoKor ?? l.busNo) === busNo || l.busNo === busNo
  );

  return matched?.busLastTime ?? null;
}
