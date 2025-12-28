import { http } from "@/utils/http";
import type { ResponseData } from "@/utils/http/types.d";

export interface CommunityShequ {
  id: number; // 社区 ID
  name?: string; // 中文展示名称
  shequ_name?: string; // 英文标识
  active_app?: string; // 绑定的第三方应用
  key?: string; // 统一英文标识
  type?: string | null; // 等级类型（如 COMMUNITY）
  level?: string | null;
  parent_id?: number | null;
  sort?: number | null;
  [key: string]: any;
}

export interface GetCommunityShequListParams {
  active_app?: boolean | null;
}

export const getCommunityShequList = (params?: GetCommunityShequListParams) =>
  http.get<ResponseData<CommunityShequ[]>>("/api/community/shequ/list", {
    params: params || { active_app: "True" }
  });

export interface UpdateCommunityActiveAppParams {
  shequ_id: number;
  active_app: string;
}

export const updateCommunityActiveApp = (
  params: UpdateCommunityActiveAppParams
) =>
  http.put<ResponseData<any>>(
    "/api/jyh/shequ/update_active_app",
    {},
    { params }
  );
