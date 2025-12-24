// middleware/blockFinal.js
import Paper from "../models/Paper.js";

export const blockIfFinal = async (req, res, next) => {
  const paper = await Paper.findById(req.params.paperId);

  if (paper.status === "finalized" && req.user.role !== "hod") {
    return res.status(403).json({ message: "Access denied. FINALIZED paper." });
  }

  next();
};
