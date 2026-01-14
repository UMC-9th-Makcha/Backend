// src/services/myPlace.service.js

import { insertMyPlace } from "../repositories/myPlace.repository.js";
import { patchMyPlace, findMyPlace } from "../repositories/myPlace.repository.js";

// create
export const createMyplace = async (payload) => {
    return insertMyPlace(payload);
};

// update(PATCH)
