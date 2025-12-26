import { hasPerms } from "@/utils/auth";
import { hasAuth } from "@/router/utils";

/**
 * Dynamic 组件统一的权限判断入口：
 * - mode="perms"：只走登录 permissions
 * - mode="auth"：只走路由 meta.auths
 * - 默认：优先 perms，其次 auth（用于新项目里逐步迁移统一字段）
 */
export function checkDynamicPermission(
  value?: string | string[] | null,
  mode?: "perms" | "auth"
) {
  if (!value) return true;
  if (mode === "perms") return hasPerms(value);
  if (mode === "auth") return hasAuth(value);
  return hasPerms(value) || hasAuth(value);
}
