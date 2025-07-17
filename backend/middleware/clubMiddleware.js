const allowedLevels = {
  Free: [], // special case: handle in controller
  Beginner: ["Beginner"],
  Intermediate: ["Beginner", "Intermediate"],
  Advanced: ["Beginner", "Intermediate", "Advanced"],
};

const clubMiddleware = (requiredLevel) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userLevel = user.clubStatus || "Free";

    // If user is Free, handle max access in controller based on free limit
    if (userLevel === "Free") {
      return res.status(403).json({
        message: "Upgrade to a membership to access this content",
      });
    }

    if (!allowedLevels[userLevel].includes(requiredLevel)) {
      return res.status(403).json({
        message: `Your ${userLevel} membership does not grant access to ${requiredLevel}-level content`,
      });
    }

    next(); // Access granted
  };
};

export default clubMiddleware;
