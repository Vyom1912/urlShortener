import { Router } from "express";
import {
  postURLShortner,
  getURLShortner,
  redirectToShortCode,
  redirectToUserShortCode,
  getShortenerEditPage,
  updateShortLinkHandler,
  deleteShortLink,
} from "../controllers/shortener.controller.js";

const router = Router();

router.get("/", getURLShortner);
router.post("/", postURLShortner);

router
  .route("/edit/:id")
  .get(getShortenerEditPage)
  .post(updateShortLinkHandler);

router.route("/delete/:id").post(deleteShortLink);

router.get("/:handle/:shortCode", redirectToUserShortCode);
router.get("/:shortCode", redirectToShortCode);

export const shortenerRoutes = router;
