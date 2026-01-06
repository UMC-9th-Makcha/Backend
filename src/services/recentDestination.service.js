// src/services/recentDestination.service.js

import { findRecentDestinations } from "../repositories/recentDestination.repository.js";

export const getRecentDestinations = (userId, limit) => {
    return findRecentDestinations(userId, limit);
}