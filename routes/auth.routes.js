import { Router } from "express";
import * as authControllers from "../controllers/auth.controller.js";
const router = Router();

// router.get("/register", authControllers.getRegisterPage);

// there is two way for same page's get and post method
// router.get("/login", authControllers.getLoginPage);
// router.post("/login", authControllers.postLogin);
// or
router
  .route("/login")
  .get(authControllers.getLoginPage)
  .post(authControllers.postLogin);

router
  .route("/register")
  .get(authControllers.getRegisterPage)
  .post(authControllers.postRegister);

router.route("/me").get(authControllers.getMe);

router.route("/logout").get(authControllers.logoutUser);
export const authRoute = router;
