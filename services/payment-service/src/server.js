require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5004;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Payment service running on port ${PORT}`);
  });
});
