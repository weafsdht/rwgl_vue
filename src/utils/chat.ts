import type { ChatConversationVO, ChatMessageVO, ChatMsgType } from '@/types';

export function peerUserIdOf(c: ChatConversationVO): number | undefined {
  return c.peerUserId ?? c.peer_user_id ?? c.peer?.id;
}

export function msgTypeOf(m: ChatMessageVO): ChatMsgType {
  return (m.msgType ?? m.msg_type ?? 0) as ChatMsgType;
}

export function messageTime(m: ChatMessageVO): string {
  return m.createdAt ?? m.created_at ?? '';
}

export function senderIdOf(m: ChatMessageVO): number | undefined {
  return m.senderUserId ?? m.sender_user_id;
}

export function fileUrlOf(m: ChatMessageVO): string {
  return (m.fileUrl ?? m.file_url ?? '').trim();
}

export function fileNameOf(m: ChatMessageVO): string {
  return (m.fileName ?? m.file_name ?? 'file').trim() || 'file';
}

export function unreadOf(c: ChatConversationVO): number {
  const n = c.unreadCount ?? c.unread_count;
  return typeof n === 'number' ? n : 0;
}

export function peerReadMyLastOf(c: ChatConversationVO): boolean {
  const v = c.peerReadMyLast ?? c.peer_read_my_last;
  return Boolean(v);
}

export function lastMessageTime(c: ChatConversationVO): string {
  return (c.lastMessageAt ?? c.last_message_at ?? '').trim();
}

export function peerLabel(c: ChatConversationVO): string {
  const p = c.peer;
  const pid = peerUserIdOf(c);
  if (!p) return pid != null ? `用户 ${pid}` : '未知';
  return p.nickname?.trim() || p.username?.trim() || p.email || `用户 ${p.id}`;
}

export function previewText(c: ChatConversationVO): string {
  const lm = c.lastMessage;
  if (lm) {
    const t = msgTypeOf(lm);
    if (t === 1) return '[图片]';
    if (t === 2) return `[文件] ${fileNameOf(lm)}`;
    const content = lm.content?.trim();
    if (content) return content;
  }
  if (c.lastMessagePreview?.trim()) return c.lastMessagePreview.trim();
  return '暂无消息';
}
