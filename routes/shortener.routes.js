import { Router } from "express";
import {
  postURLShortner,
  getURLShortner,
  redirectToShortCode,
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

router.get("/:shortCode", redirectToShortCode);

router.get("/404", (req, res) => {
  res.status(404).send("Page Not Found");
});

export const shortenerRoutes = router;
