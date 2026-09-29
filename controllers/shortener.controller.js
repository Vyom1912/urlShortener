import crypto from "crypto";
import {
  getAllShortLinks,
  getUserShortLinkByShortCode,
  getLegacyShortLink,
  insertShortLink,
  findUserShortLinkById,
  updateShortLink,
  deleteShortLinkById,
  incrementShortLinkClicks,
  ensureUserHandle,
  findUserByHandle,
} from "../services/shortener.services.js";

import { shortenerSchema } from "../validators/shortener.validator.js";

const getHost = (req) => `${req.protocol}://${req.get("host")}`;

// ---------------- HOME ----------------

export const getURLShortner = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  // Old "?edit=<id>" links now have their own page
  if (req.query.edit) return res.redirect(`/edit/${req.query.edit}`);

  const [links, handle] = await Promise.all([
    getAllShortLinks(req.user.id),
    ensureUserHandle(req.user.id),
  ]);

  return res.render("index", {
    title: "Home",
    links,
    handle,
    host: getHost(req),
    errors: req.flash("errors"),
    success: req.flash("success"),
    old: req.flash("old")[0] || {},
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
    req.flash("old", req.body);
    return res.redirect("/");
  }

  const { url, shortCode } = result.data;

  let finalShortCode = shortCode;
  if (!finalShortCode) {
    // Random code, retried in the (very unlikely) case this user already has it
    do {
      finalShortCode = crypto.randomBytes(3).toString("hex");
    } while (await getUserShortLinkByShortCode(req.user.id, finalShortCode));
  } else if (await getUserShortLinkByShortCode(req.user.id, finalShortCode)) {
    req.flash("errors", "You already have a link with that short code");
    req.flash("old", req.body);
    return res.redirect("/");
  }

  await insertShortLink({
    url,
    shortCode: finalShortCode,
    userId: req.user.id,
  });

  req.flash("success", "Short link created!");
  return res.redirect("/");
};

// ---------------- REDIRECT ----------------

const followLink = async (link, res) => {
  await incrementShortLinkClicks(link._id);
  return res.redirect(link.url);
};

// /<handle>/<shortCode> — each user's own namespace
export const redirectToUserShortCode = async (req, res, next) => {
  const owner = await findUserByHandle(req.params.handle);
  if (!owner) return next();

  const link = await getUserShortLinkByShortCode(owner._id, req.params.shortCode);
  if (!link) return next();

  return followLink(link, res);
};

// /<shortCode> — links created before handles existed keep working
export const redirectToShortCode = async (req, res, next) => {
  const link = await getLegacyShortLink(req.params.shortCode);

  if (!link) return next();

  return followLink(link, res);
};

// ---------------- EDIT PAGE ----------------

export const getShortenerEditPage = async (req, res, next) => {
  if (!req.user) return res.redirect("/login");

  const shortLink = await findUserShortLinkById(req.params.id, req.user.id);

  if (!shortLink) return next(); // → 404

  const old = req.flash("old")[0];

  res.render("edit-shortLink", {
    title: "Edit link",
    id: shortLink._id,
    url: old?.url ?? shortLink.url,
    shortCode: old?.shortCode ?? shortLink.shortCode,
    handle: await ensureUserHandle(req.user.id),
    host: getHost(req),
    errors: req.flash("errors"),
  });
};

// ---------------- UPDATE ----------------

export const updateShortLinkHandler = async (req, res, next) => {
  if (!req.user) return res.redirect("/login");

  const shortLink = await findUserShortLinkById(req.params.id, req.user.id);
  if (!shortLink) return next();

  const result = shortenerSchema.safeParse(req.body);

  if (!result.success) {
    req.flash(
      "errors",
      result.error.issues.map((e) => e.message),
    );
    req.flash("old", req.body);
    return res.redirect(`/edit/${req.params.id}`);
  }

  const { url } = result.data;
  const shortCode = result.data.shortCode || shortLink.shortCode;

  const existing = await getUserShortLinkByShortCode(req.user.id, shortCode);

  if (existing && existing._id.toString() !== req.params.id) {
    req.flash("errors", "You already have a link with that short code");
    req.flash("old", req.body);
    return res.redirect(`/edit/${req.params.id}`);
  }

  await updateShortLink({
    id: req.params.id,
    userId: req.user.id,
    url,
    shortCode,
  });

  req.flash("success", "Link updated");
  return res.redirect("/");
};

// ---------------- DELETE ----------------

export const deleteShortLink = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  await deleteShortLinkById(req.params.id, req.user.id);

  req.flash("success", "Link deleted");
  return res.redirect("/");
};
