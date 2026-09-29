function formatApiError(detail) {
  if (!detail) return "Something went wrong";

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.msg && item?.loc) return `${item.loc.join(" -> ")}: ${item.msg}`;
        if (item?.msg) return item.msg;
        return JSON.stringify(item);
      })
      .join(", ");
  }

  if (typeof detail === "object") {
    if (detail.msg) return detail.msg;
    return JSON.stringify(detail);
  }

  return String(detail);
}

async function request(url, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(formatApiError(data?.detail || data || response.statusText));
  }

  return data;
}
