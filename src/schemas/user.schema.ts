import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  name: String,
  access_token: String,
  openid: Object,
  unionid: String,
  refresh_token: String,
  userInfo: Object,
  type: String, // 用户属于哪个应用
});
