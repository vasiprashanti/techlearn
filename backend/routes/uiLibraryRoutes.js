import express from "express";

const router = express.Router();

// Sample UI Library data
const uiLibrary = [
  {
    name: "Button",
    description: "A simple button component with customizable styles.",
    usage: "<Button label='Click Me' />",
    category: "Form Controls",
  },
  {
    name: "Modal",
    description: "A modal dialog for displaying content in an overlay.",
    usage: "<Modal isOpen={true}>Content here</Modal>",
    category: "Feedback",
  },
  {
    name: "Card",
    description:
      "A flexible container for displaying content in a card layout.",
    usage: "<Card title='Profile'>User info here</Card>",
    category: "Layout",
  },
];

// Route to serve UI Library data as JSON
router.get("/api/ui-library", (req, res) => {
  res.json(uiLibrary);
});

export default router;
