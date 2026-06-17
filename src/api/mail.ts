/**
 * SMTP 发信：POST /api/mail/send（需登录）
 * 请求体字段与后端 SendMailRequest 一致（camelCase），授权码不落库，由后端临时建 JavaMailSender。
 */
import { request } from '@/utils/request';

export interface SendMailRequest {
  smtpHost: string;
  /** 默认 465；TLS 常用 587 */
  smtpPort?: number;
  fromEmail: string;
  /** SMTP 授权码 */
  fromPassword: string;
  /** 默认 true；false 时走 STARTTLS */
  ssl?: boolean;
  /** 有值则只发这些地址；不传或空数组 = 系统内有邮箱的用户（排除与 fromEmail 相同） */
  toEmails?: string[];
  subject: string;
  /** 正文，可 HTML */
  content: string;
  /** 默认 true */
  html?: boolean;
}

export interface SendMailResponse {
  totalRecipients: number;
  successCount: number;
  failCount: number;
  failedEmails: string[];
}

export function sendMail(body: SendMailRequest) {
  return request.post<SendMailResponse>('/mail/send', body);
}

export default {
  sendMail,
};
