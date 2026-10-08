const clientsByUser = new Map();

function writeEvent(response, event, data) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function subscribeToNotifications(userId, response) {
  const key = Number(userId);
  const clients = clientsByUser.get(key) || new Set();
  clients.add(response);
  clientsByUser.set(key, clients);

  writeEvent(response, "connected", { connected: true });

  return () => {
    const current = clientsByUser.get(key);
    if (!current) return;
    current.delete(response);
    if (current.size === 0) clientsByUser.delete(key);
  };
}

export function publishNotification(userId, notification = null) {
  const key = Number(userId);
  const clients = clientsByUser.get(key);
  if (!clients?.size) return;

  for (const response of clients) {
    try {
      writeEvent(response, "notification", notification);
    } catch {
      clients.delete(response);
    }
  }

  if (clients.size === 0) clientsByUser.delete(key);
}

export function startNotificationHeartbeat(intervalMs = 25_000) {
  const timer = setInterval(() => {
    for (const [userId, clients] of clientsByUser.entries()) {
      for (const response of clients) {
        try {
          response.write(": heartbeat\n\n");
        } catch {
          clients.delete(response);
        }
      }
      if (clients.size === 0) clientsByUser.delete(userId);
    }
  }, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
