import Notification from '../models/Notification.js';

export async function createNotification({ userId, title, message, type = 'INFO', link = '' }) {
  try {
    if (!userId) return null;
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
      isRead: false,
    });
    return notification;
  } catch (err) {
    console.error('[Notification creation error]', err);
    return null;
  }
}
