import crypto from "crypto";
import {
  getAllShortLinks,
  getShortlinkByShortCode,
  insertShortLink,
  findShortLinkById,
  updateShortLink,
  deleteShortLinkById,
} from "../services/shortener.services.js";

import { shortenerSchema } from "../validators/shortener.validator.js";

// ---------------- HOME ----------------

export const getURLShortner = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const links = await getAllShortLinks(req.user.id);

  let editLink = null;

  if (req.query.edit) {
    editLink = await findShortLinkById(req.query.edit);
  }

  return res.render("index", {
    links,
    editLink,
    host: req.protocol + "://" + req.get("host"),
    errors: req.flash("errors"),
  });
};

// ---------------- CREATE ----------------

export const postURLShortner = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const result = shortenerSchema.safeParse(req.body);

  if (!result.success) {
    req.flash(
      "errors",
      result.error.issues.map((e) => e.message),
    );
    return res.redirect("/");
  }

  const { url, shortCode } = result.data;

  const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

  const existing = await getShortlinkByShortCode(finalShortCode);

  if (existing) {
    req.flash("errors", "Shortcode already exists");
    return res.redirect("/");
  }

  await insertShortLink({
    url,
    shortCode: finalShortCode,
    userId: req.user.id,
  });

  return res.redirect("/");
};

// ---------------- REDIRECT ----------------

export const redirectToShortCode = async (req, res, next) => {
  const link = await getShortlinkByShortCode(req.params.shortCode);

  if (!link) return next();

  return res.redirect(link.url);
};

// ---------------- EDIT PAGE ----------------

export const getShortenerEditPage = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const shortLink = await findShortLinkById(req.params.id);

  if (!shortLink) return res.redirect("/404");

  res.render("edit-shortLink", {
    id: shortLink._id,
    url: shortLink.url,
    shortCode: shortLink.shortCode,
    errors: req.flash("errors"),
  });
};

// ---------------- UPDATE ----------------

export const updateShortLinkHandler = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const result = shortenerSchema.safeParse(req.body);

  if (!result.success) {
    req.flash(
      "errors",
      result.error.issues.map((e) => e.message),
    );
    return res.redirect(`/edit/${req.params.id}`);
  }

  const { url, shortCode } = result.data;

  const existing = await getShortlinkByShortCode(shortCode);

  if (existing && existing._id.toString() !== req.params.id) {
    req.flash("errors", ["Shortcode already exists"]);
    return res.redirect(`/?edit=${req.params.id}`);
  }

  await updateShortLink({
    id: req.params.id,
    url,
    shortCode,
  });

  return res.redirect("/");
};

// ---------------- DELETE ----------------

export const deleteShortLink = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  await deleteShortLinkById(req.params.id, req.user.id);

  return res.redirect("/");
};
