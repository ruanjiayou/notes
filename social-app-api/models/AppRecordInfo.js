const uuid = require("uuid");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    _id: {
      type: "string",
      default() {
        return uuid.v1();
      },
      allowUpdate: false,
    },
    date: { type: "string" },
    app_id: { type: "string" },
    created_time: {
      type: "date",
      default() {
        return new Date();
      },
    }, // 创建时间
    counter: {
      type: "object",
    },
  },
  {
    strict: true,
    collection: "social_app_record_info",
  }
);

module.exports = mongoose.model("social_app_record_info", schema);
