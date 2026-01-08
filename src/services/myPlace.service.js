// src/services/myPlace.service.js

import { insertMyPlace } from "../repositories/myPlace.repository.js";

export const createMyplace = async (payload) => {
    return insertMyPlace(payload);
};