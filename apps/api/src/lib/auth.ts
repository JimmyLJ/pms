import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "../db";
import * as schema from "../db/schema";
import { sendEmail } from "./email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
    }
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "重置您的密码 - PMS 项目管理",
        html: `
          <div style="max-width: 480px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; color: #333;">
            <h2 style="color: #0ea5e9;">PMS 项目管理</h2>
            <p>您好 <strong>${user.name}</strong>，</p>
            <p>我们收到了您的密码重置请求。请点击下方按钮设置新密码：</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}" style="display: inline-block; padding: 12px 32px; background-color: #0ea5e9; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                重置密码
              </a>
            </div>
            <p style="color: #999; font-size: 13px;">如果按钮无法点击，请复制以下链接到浏览器：</p>
            <p style="color: #999; font-size: 13px; word-break: break-all;">${url}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">如果您没有请求重置密码，请忽略此邮件，您的密码不会被更改。</p>
          </div>
        `,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "验证您的邮箱 - PMS 项目管理",
        html: `
          <div style="max-width: 480px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; color: #333;">
            <h2 style="color: #0ea5e9;">PMS 项目管理</h2>
            <p>您好 <strong>${user.name}</strong>，</p>
            <p>感谢您注册 PMS！请点击下方按钮验证您的邮箱地址：</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}" style="display: inline-block; padding: 12px 32px; background-color: #0ea5e9; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                验证邮箱
              </a>
            </div>
            <p style="color: #999; font-size: 13px;">如果按钮无法点击，请复制以下链接到浏览器：</p>
            <p style="color: #999; font-size: 13px; word-break: break-all;">${url}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #999; font-size: 12px;">如果您没有注册 PMS，请忽略此邮件。</p>
          </div>
        `,
      });
    },
  },
  trustedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
  plugins: [
    organization()
  ]
});
