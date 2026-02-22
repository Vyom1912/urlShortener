import crypto from "crypto";
import {
  loadLinks,
  saveLinks,
  getLinkByShortCode,
} from "../models/shortener.model.js";

// export const getURLShortner = async (req, res) => {
//   try {
//     const links = await loadLinks();
//     return res.render("index", {
//       links,
//       host: req.protocol + "://" + req.get("host"),
//       user: null, // temporary fix
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).send(" get Internal Server Error");
//   }
// };
export const getURLShortner = async (req, res) => {
  try {
    const links = await loadLinks();

    return res.render("index", {
      links,
      host: req.protocol + "://" + req.get("host"),
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
    await saveLinks({ url, shortCode: finalShortCode });
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
      return res.status(404).render("404", { title: "404" });
    }

    return res.redirect(link.url);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};
