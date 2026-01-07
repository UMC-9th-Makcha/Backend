// src/services/recentDestination.service.js

import { findRecentDestinations } from "../repositories/recentDestination.repository.js";
import { toRecentDestinationsDto } from "../dtos/recentDestination.dto.js";

export const getRecentDestinations = async (userId, limit) => {
    const rows = await findRecentDestinations(userId, limit);
    return rows.map(toRecentDestinationsDto);
}