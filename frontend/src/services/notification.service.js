import axiosClient, { tokenStorage } from "../api/axios";

export function formatNotificationTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN");
}

export const notificationService = {
  getNotifications: async (params = {}) => {
    const res = await axiosClient.get("/notifications", { params });
    return {
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      unread_count: res.data?.unread_count ?? 0,
      pagination: res.data?.pagination || null,
    };
  },

  getUnreadCount: async () => {
    const res = await axiosClient.get("/notifications/unread-count");
    return res.data?.data?.unread_count ?? 0;
  },

  markRead: (id) => axiosClient.patch(`/notifications/${id}/read`),

  markAllRead: () => axiosClient.patch("/notifications/read-all"),

  create: (payload) => axiosClient.post("/notifications", payload),

  subscribe(onNotification, onStatus = () => {}) {
    const controller = new AbortController();
    let active = true;
    let retryTimer = null;

    const connect = async () => {
      const token = tokenStorage.getAccessToken();
      if (!active || !token) return;

      try {
        onStatus("connecting");
        const response = await fetch(
          `${axiosClient.defaults.baseURL}/notifications/stream`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );
        if (response.status === 401) {
          await notificationService.getUnreadCount();
        }
        if (!response.ok || !response.body) {
          throw new Error(`SSE ${response.status}`);
        }

        onStatus("connected");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (active) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split(/\r?\n\r?\n/);
          buffer = frames.pop() || "";

          for (const frame of frames) {
            let eventName = "message";
            const dataLines = [];
            for (const line of frame.split(/\r?\n/)) {
              if (line.startsWith("event:")) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trimStart());
              }
            }
            if (eventName !== "notification" || !dataLines.length) continue;
            try {
              onNotification(JSON.parse(dataLines.join("\n")));
            } catch {
              // Bỏ qua frame không hợp lệ và tiếp tục giữ kết nối.
            }
          }
        }
      } catch (error) {
        if (!active || error.name === "AbortError") return;
        onStatus("disconnected");
      }

      if (active) retryTimer = window.setTimeout(connect, 3000);
    };

    connect();
    return () => {
      active = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      controller.abort();
    };
  },
};

export default notificationService;
