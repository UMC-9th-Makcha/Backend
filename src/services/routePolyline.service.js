import {
  deleteRouteToken,
  getRouteToken,
} from "../utils/routeTokenStore.util.js";
import { fetchLoadLane } from "../repositories/odsayLane.repository.js";
import { parseLoadLaneToPaths } from "../utils/odsayPolyline.util.js";
import { CustomError } from "../response/customError.js";
import { isLikelyValidOdsayMapObject } from "../utils/odsayMapObject.util.js";

function throwCustom(errorCode, message, path, statusCode = 500, result = {}) {
  const err = new CustomError(errorCode, message, path, result);
  err.statusCode = statusCode;
  throw err;
}

export async function getPolylineByRouteToken({ routeToken }) {
  const PATH = `/api/routes/polylines/${routeToken}`;

  const cached = getRouteToken(routeToken);

  // 토큰 없음/만료
  if (!cached) {
    throwCustom(
      "MAP-410-001",
      "경로 토큰이 만료되었거나 존재하지 않습니다.",
      PATH,
      410,
      null,
    );
  }

  const mapObject = cached?.mapObj;

  // 토큰은 있는데 mapObject 없음
  if (!mapObject) {
    deleteRouteToken(routeToken);
    throwCustom(
      "MAP-410-002",
      "mapObject가 없어 폴리라인을 생성할 수 없습니다. 경로를 다시 조회해주세요.",
      PATH,
      410,
      { reason: "MAP_OBJECT_NOT_FOUND" },
    );
  }

  // mapObject가 이상 -> ODsay 호출 전에 컷 + 토큰 삭제
  if (!isLikelyValidOdsayMapObject(mapObject)) {
    deleteRouteToken(routeToken);
    throwCustom(
      "MAP-422-001",
      "경로 폴리라인을 조회할 수 없습니다. 경로를 다시 조회해주세요.",
      PATH,
      422,
      { reason: "MAP_OBJECT_INVALID" },
    );
  }

  const { ok, status, data } = await fetchLoadLane({ mapObject, lang: 0 });

  if (!ok) {
    throwCustom("COM-500-001", "ODsay loadLane upstream 오류", PATH, 502, {
      status,
      data,
    });
  }

  // ODsay API 에러
  if (data?.error) {
    const first = Array.isArray(data.error) ? data.error[0] : data.error;
    const code = first?.code != null ? String(first.code) : null;

    // -8: mapObject 형식 오류
    if (code === "-8") {
      deleteRouteToken(routeToken);
      throwCustom(
        "MAP-422-001",
        "경로 폴리라인을 조회할 수 없습니다. 다시 경로를 조회해주세요.",
        PATH,
        422,
        { error: data.error },
      );
    }

    // 그 외 에러는 502
    throwCustom("COM-500-001", "ODsay loadLane API error", PATH, 502, {
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
    throwCustom(
      "MAP-404-003",
      "폴리라인 데이터를 찾을 수 없습니다.",
      PATH,
      404,
      {
        mapObject,
      },
    );
  }

  return {
    route_token: routeToken,
    map_object: mapObject, // 디버그용
    paths,
    boundary,
  };
}
