import { getRouteToken } from "../utils/routeTokenStore.util.js";
import { fetchLoadLane } from "../repositories/odsayLane.repository.js";
import { parseLoadLaneToPaths } from "../utils/odsayPolyline.util.js";

export async function getPolylineByRouteToken({ routeToken }) {
  const cached = getRouteToken(routeToken);

  if (!cached) {
    const err = new Error("ROUTE_TOKEN_EXPIRED");
    err.status = 410;
    throw err;
  }

  const mapObject = cached?.mapObj;
  if (!mapObject) {
    const err = new Error("MAP_OBJECT_NOT_FOUND");
    err.status = 500;
    throw err;
  }

  const { ok, status, data } = await fetchLoadLane({ mapObject, lang: 0 });

  if (!ok) {
    const err = new Error(`ODsay loadLane HTTP error: status=${status}`);
    err.status = 502;
    throw err;
  }
  if (data?.error) {
    const err = new Error(
      `ODsay loadLane API error: ${JSON.stringify(data.error)}`,
    );
    err.status = 502;
    throw err;
  }

  const { paths, boundary } = parseLoadLaneToPaths(data);

  return {
    route_token: routeToken,
    map_object: mapObject, // 디버그용
    paths,
    boundary,
  };
}
