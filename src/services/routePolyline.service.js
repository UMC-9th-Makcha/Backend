import { getRouteToken } from "../utils/routeTokenStore.util.js";
import { fetchLoadLane } from "../repositories/odsayLane.repository.js";
import { parseLoadLaneToPaths } from "../utils/odsayPolyline.util.js";
import { CustomError } from "../response/customError.js";

function throwCustom(errorCode, message, path, statusCode = 500, result = {}) {
  const err = new CustomError(errorCode, message, path, result);
  err.statusCode = statusCode;
  throw err;
}

export async function getPolylineByRouteToken({ routeToken }) {
  const PATH = `/api/routes/polylines/${routeToken}`;

  const cached = getRouteToken(routeToken);

  if (!cached) {
    throwCustom(
      "MAP-404-002",
      "경로가 만료되었어요. 다시 조회해 주세요.",
      PATH,
      410,
      { reason: "ROUTE_TOKEN_EXPIRED" },
    );
  }

  const mapObject = cached?.mapObj;
  if (!mapObject) {
    throwCustom(
      "COM-500-001",
      "mapObject가 없어 폴리라인을 생성할 수 없습니다.",
      PATH,
      500,
      { reason: "MAP_OBJECT_NOT_FOUND" },
    );
  }

  console.log("[polyline] mapObject=", mapObject);

  const { ok, status, data } = await fetchLoadLane({ mapObject, lang: 0 });

  if (!ok) {
    throwCustom("COM-500-001", `ODsay loadLane HTTP error`, PATH, 502, {
      status,
    });
  }
  if (data?.error) {
    throwCustom("COM-500-001", `ODsay loadLane API error`, PATH, 502, {
      error: data.error,
    });
  }

  let parsed;
  try {
    parsed = parseLoadLaneToPaths(data);
  } catch (e) {
    throwCustom("COM-500-001", "폴리라인 파싱 실패", PATH, 500, {
      message: e?.message,
    });
  }

  const { paths, boundary } = parsed ?? {};

  if (!Array.isArray(paths) || paths.length === 0) {
    throwCustom("MAP-404-002", "폴리라인 데이터가 비어있습니다.", PATH, 404, {
      mapObject,
    });
  }

  return {
    route_token: routeToken,
    map_object: mapObject, // 디버그용
    paths,
    boundary,
  };
}
