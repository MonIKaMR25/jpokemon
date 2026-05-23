function cleanPath(path) {
  if (!path || path === "#" || path === "") return "/";
  const withoutHash = path.replace(/^#/, "");
  return withoutHash.startsWith("/") ? withoutHash : `/${withoutHash}`;
}

export function getRouteFromHash(hashValue = window.location.hash) {
  const path = cleanPath(hashValue);
  const detailMatch = path.match(/^\/pokemon\/(\d+)$/);

  if (detailMatch) {
    return { name: "detail", params: { id: Number(detailMatch[1]) } };
  }

  if (path === "/" || path === "/home") {
    return { name: "home", params: {} };
  }

  if (path === "/battle") {
    return { name: "battle", params: {} };
  }

  if (path === "/mypokedex") {
    return { name: "mypokedex", params: {} };
  }

  return { name: "notFound", params: {} };
}

export function navigateTo(path) {
  const next = path.startsWith("#") ? path : `#${path}`;
  window.location.hash = next;
}
