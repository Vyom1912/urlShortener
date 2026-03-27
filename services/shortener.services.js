import { ShortLink } from "../models/ShortLink.js";

export const getAllShortLinks = (userId) => ShortLink.find({ userId });

export const getShortlinkByShortCode = (shortCode) =>
  ShortLink.findOne({ shortCode });

export const insertShortLink = (data) => ShortLink.create(data);

export const findShortLinkById = (id) => ShortLink.findById(id);

export const updateShortLink = ({ id, url, shortCode }) =>
  ShortLink.findByIdAndUpdate(id, { url, shortCode });

export const deleteShortLinkById = (id, userId) =>
  ShortLink.deleteOne({ _id: id, userId });
