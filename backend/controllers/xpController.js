import UserProgress from "../models/UserProgress.js";

export const addXP = async (req, res) => {
  // console.log('req.user: ', req.user);
  // if(!req.user){
  //     return res.status(401).json({message: "User not authenticated"});
  // } testing what we are getting after hitting the api endpoints

  const { source, points } = req.body;
  // ✅ Fix: Use req.user._id instead of req.user.id
  const userId = req.user._id;

  try {
    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = new UserProgress({ userId });
    }

    if (source === "learn") progress.xpFromLearn += points;
    else if (source === "build") progress.xpFromBuild += points;

    await progress.save();

    res.status(200).json({
      message: "XP added successfully",
      updatedXP: {
        xpFromLearn: progress.xpFromLearn,
        xpFromBuild: progress.xpFromBuild,
        totalXP: progress.xpFromLearn + progress.xpFromBuild,
      },
    });
  } catch (error) {
    console.error("Error adding XP", error);
    res.status(500).json({ message: "Server error" });
  }
};
