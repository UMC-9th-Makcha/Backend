export const devAuth = (req, res, next) => {
  // 테스트용: 헤더에 x-user-id 없으면 막음
  const userId = req.header("x-user-id");

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized (dev auth)" });
  }

  // 숫자로 변환해서 컨트롤러에서 쓰게 함
  req.userId = Number(userId);
  return next();
};