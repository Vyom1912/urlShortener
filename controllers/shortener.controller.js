import crypto from "crypto";
import {
  insertShortLink,
  getAllShortLinksByUser,
  getShortlinkByShortCode,
} from "../services/shortener.services.js";

// Show dashboard (only user links)
export const getURLShortner = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const links = await getAllShortLinksByUser(req.user.id);

  res.render("index", {
    links,
    host: req.protocol + "://" + req.get("host"),
  });
};

// Create short link
export const postURLShortner = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/login");
    }
    const { url, shortCode } = req.body;
    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

    // const links = await loadLinks();
    const links = await getAllShortLinksByUser(req.user.id);

    if (links.some((link) => link.shortCode === finalShortCode)) {
      return res
        .status(400)
        .send("Short code already exists. Please choose another.");
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

// export const redirectToShortCode = async (req, res) => {
//   try {
//     const { shortCode } = req.params;

//     // const link = await getShortlinkByShortCode(shortCode);
//     const link = await getShortlinkByShortCode(shortCode);
//     if (!link) {
//       return res.status(404).render("404", { title: "404" });
//     }

//     return res.redirect(link.url);
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send("Internal Server Error");
//   }
// };
