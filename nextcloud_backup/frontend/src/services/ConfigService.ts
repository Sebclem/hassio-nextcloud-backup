import type { WebdavConfig } from "@/types/webdavConfig";
import kyClient from "./kyClient";

export function getWebdavConfig() {
  return kyClient.get("config/webdav").json<WebdavConfig>();
}

export function saveWebdavConfig(config: WebdavConfig) {
  return kyClient
    .put("config/webdav", {
      json: config,
    })
    .json();
}
