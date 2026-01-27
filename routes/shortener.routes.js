import { Router } from "express";
import {
  postURLShortner,
  getURLShortner,
  redirectToShortCode,
} from "../controllers/postshortner.controller.js";
const router = Router();

router.get("/", getURLShortner);

router.post("/", postURLShortner);

router.get("/:shortCode", redirectToShortCode);
export const shortenerRouter = router;
