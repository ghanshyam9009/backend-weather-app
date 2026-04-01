import { Router } from "express";

import {
  getRecentSearches,
  getWeatherByQuery,
} from "../controllers/weatherController.js";

const router = Router();

router.get("/", getWeatherByQuery);
router.get("/recent", getRecentSearches);

export default router;

