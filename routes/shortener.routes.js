import { Router } from "express";
import {
  postUrlShortener,
  getUrlShortener,
  deleteShortLink,
  updateShortLinkHandler,
  redirectToShortCode,
} from "../controllers/shortener.controller.js";
const router = Router();
router.route("/").get(getUrlShortener).post(postUrlShortener);

router.route("/delete/:id").post(deleteShortLink);
router.post("/edit/:id", updateShortLinkHandler);

// 🔥 MUST BE LAST
router.get("/:shortCode", redirectToShortCode);

export const shortenerRouter = router;
