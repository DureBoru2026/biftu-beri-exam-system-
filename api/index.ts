import serverless from "serverless-http";
import app from "../src/api";

export default serverless(app);
