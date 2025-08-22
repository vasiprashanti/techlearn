import express from "express";
import { getCollegeByName } from "../controllers/collegeController.js";

const collegeRouter = express.Router();
collegeRouter.get("/:collegeName", getCollegeByName);

export default collegeRouter;
