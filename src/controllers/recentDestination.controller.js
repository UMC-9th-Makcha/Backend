// src/controllers/recentDestination.controller.js

export const getRecentDestinationsHandler = async(req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        return res.status(200).json({
            recentDestinations: [],
        });
    } catch (err) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};