import crypto from "crypto";
// import path from "path";
// import { readFile } from "fs/promises";
import {
  loadLinks,
  saveLinks,
  getLinkByShortCode,
} from "../models/shortener.model.js";

export const getURLShortner = async (req, res) => {
  try {
    const links = await loadLinks();
    return res.render("index", {
      links,
      host: req.host,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(" get Internal Server Error");
  }
};

export const postURLShortner = async (req, res) => {
  try {
    const { url, shortCode } = req.body;
    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

    const links = await loadLinks();

    if (links[finalShortCode]) {
      return res
        .status(400)
        .send("Short code already exists. Please choose another.");
    }
    await saveLinks({ url, shortCode });
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.status(500).send("post Internal Server Error");
  }
};

export const redirectToShortCode = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const link = await getLinkByShortCode(shortCode);
    if (!link) {
      return res.redirect("/404");
    }

    return res.redirect(link.url);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};
