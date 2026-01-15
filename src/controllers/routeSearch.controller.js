import { getRouteCandidates } from "../services/routeSearch.service.js";
import { CustomError } from "../response/customError.js";
import { CustomSuccess } from "../response/customSuccess.js";

export async function postRouteCandidates(req, res) {
  const path = "/routes/candidates";

  try {
    const { origin, destination } = req.body ?? {};
    if (
      !origin?.lat ||
      !origin?.lng ||
      !destination?.lat ||
      !destination?.lng
    ) {
      return res
        .status(400)
        .json(new CustomError("COM-400-001", "필수 파라미터 누락", path));
    }

    const candidates = await getRouteCandidates({ origin, destination });

    return res.status(200).json(
      new CustomSuccess("ROUTE-200-001", 200, "후보 경로 조회 성공", {
        candidates,
      })
    );
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json(new CustomError("COM-500-001", "서버 내부 오류", path));
  }
}
