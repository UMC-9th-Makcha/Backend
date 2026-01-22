// src/controllers/saveReport.controller.js
import { getSaveReport } from "../services/saveReport.service.js";

//기본 month(KST)
function getDefaultMonthSeoul() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === "year").value;
    const m = parts.find(p => p.type === "month").value;
    return `${y}-${m}`;
}

export const getSaveReportHandler = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const month = req.query.month ? String(req.query.month) : getDefaultMonthSeoul();

        const result = await getSaveReport({ userId, month });

        return res.status(200).json({
            successCode: "SAVEREPORT-200-001",
            statusCode: 200,
            message: "세이브 리포트 조회 성공",
            result,
        });
    } catch (err) {
        return next(err);
  }
};
