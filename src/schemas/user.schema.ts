import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  name: String,
  access_token: String,
  openid: String,
  unionid: String,
  refresh_token: String,
  userInfo: Object,
  authorized: Boolean, // 用户是否已授权
  type: String, // 用户属于哪个应用
});
