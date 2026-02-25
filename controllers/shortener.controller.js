import { z } from "zod";
import crypto from "crypto";
import {
  getAllShortLinksByUser,
  getShortlinkByShortCode,
  insertShortLink,
  findShortLinkById,
  updateShortLink,
  deleteShortLinkById,
} from "../services/shortener.services.js";

import { shortenerSchema } from "../validators/shortener.validator.js";

/* =====================================================
   GET DASHBOARD PAGE(only user links)
===================================================== */
export const getUrlShortener = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const links = await getAllShortLinksByUser(req.user.id);

    let editLink = null;

    if (req.query.edit) {
      editLink = await findShortLinkById(req.query.edit);
    }

    res.render("index", {
      links,
      editLink,
      host: req.protocol + "://" + req.get("host"),
      errors: req.flash("errors"),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(" get Internal Server Error");
  }
};

/* =====================================================
   CREATE SHORT LINK
===================================================== */
export const postUrlShortener = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/login");
    }

    // ✅ Validate input
    const result = shortenerSchema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((err) => err.message);
      req.flash("errors", errors);
      return res.redirect("/");
    }

    const { url, shortCode } = result.data;

    // 🔥 Auto-generate shortCode if not provided
    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

    // const links = await loadLinks();
    const existing = await getShortlinkByShortCode(finalShortCode);

    if (existing) {
      req.flash("errors", "Shortcode already is existed by other user or you");
      return res.redirect("/");
    }
    // await saveLinks({ url, shortCode: finalShortCode });
    await insertShortLink({
      url,
      shortCode: finalShortCode,
      userId: req.user.id, // 🔥 attach logged-in user
    });
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.status(500).send("post Internal Server Error");
  }
};
/* =====================================================
   REDIRECT SHORTCODE
===================================================== */
export const redirectToShortCode = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const link = await getShortlinkByShortCode(shortCode);

    if (!link) {
      return res.status(404).render("404", { title: "404" });
    }

    return res.redirect(link.url);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

/* =====================================================
   GET EDIT PAGE
===================================================== */
export const getShortenerEditPage = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }
  // const { data: id, error } = z.coerce.number().int().safeParse(req.params.id);
  const idSchema = z.string().min(1);
  const { data: id, error } = idSchema.safeParse(req.params.id);
  if (error) {
    return res.redirect("/404"); // Invalid ID format, redirect to 404;
  }

  try {
    const shortLink = await findShortLinkById(id);
    if (!shortLink) {
      return res.redirect("/404"); // Short link not found, redirect to 404;
    }

    res.render("edit-shortLink", {
      id: shortLink.id,
      url: shortLink.url,
      shortCode: shortLink.shortCode,
      errors: req.flash("errors"),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

/* =====================================================
   UPDATE SHORT LINK
===================================================== */
export const updateShortLinkHandler = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  // const { data: id, error } = z.coerce.number().int().safeParse(req.params.id);
  const idSchema = z.string().min(1);
  const { data: id, error } = idSchema.safeParse(req.params.id);

  if (error) {
    return res.redirect("/404");
  }

  const result = shortenerSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((err) => err.message);
    req.flash("errors", errors);
    // return res.redirect(`/edit/${id}`);
    return res.redirect(`/?edit=${id}`);
  }

  const { url, shortCode } = result.data;

  try {
    const current = await findShortLinkById(id);

    if (!current) {
      return res.redirect("/404");
    }

    if (current.shortCode !== shortCode) {
      const duplicate = await getShortlinkByShortCode(shortCode);

      if (duplicate) {
        req.flash("errors", [
          "Shortcode already is existed by other user or you",
        ]);
        return res.redirect(`/?edit=${id}`);
      }
    }

    await updateShortLink({ id, url, shortCode, userId: req.user.id });

    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Update Failed");
  }
};

/* =====================================================
   DELETE SHORT LINK
===================================================== */
export const deleteShortLink = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  // ✅ Validate id as string (MongoDB uses string ObjectId)
  const idSchema = z.string().min(1);
  const { data: id, error } = idSchema.safeParse(req.params.id);

  if (error) {
    return res.redirect("/404");
  }

  try {
    await deleteShortLinkById(id, req.user.id);
    return res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Delete Failed");
  }
};
