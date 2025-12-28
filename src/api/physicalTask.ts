import { http } from "@/utils/http";

export interface TaskJob {
  id?: string | null;
  task_id: number; // 任务在后台的唯一记录 ID（字符串）
  title: string; // 任务内部名称
  jyh_shequ_id?: number | null; // 所属社区 ID
  jyh_shequ_name?: string | null; // 所属社区名称
  jyh_task_id?: number | null; // 匹配的社区任务 ID
  jyh_questionnaire_id?: number | null; // 关联问卷 ID
  status?: number; // 状态：0 草稿 10 进行中 20 已完成
  created_at?: string | null; // 创建时间（ISO）
  updated_at?: string | null; // 更新时间（ISO）
  data?: Record<string, any>; // 任务的扩展数据
  result?: Record<string, any>; // 任务执行结果
  error?: string; // 错误信息
  error_msg?: string; // 错误提示
  error_traceback?: string; // 错误栈
  error_code?: number; // 错误编码
}

export interface TaskJobCreate {
  title: string; // 任务名称
  jyh_task_id?: number | null; // 对应社区任务 ID
  jyh_questionnaire_id?: number | null; // 绑定问卷 ID
  jyh_shequ_id?: number | null; // 所属社区 ID
  jyh_shequ_name?: string | null; // 所属社区名称
  status?: number; // 状态（可选）
  data?: Record<string, any>; // 请求携带的数据
  result?: Record<string, any>; // 结果字段
  error?: string; // 错误信息
  error_msg?: string; // 提示信息
  error_traceback?: string; // 错误堆栈
  error_code?: number; // 错误码
}

export type TaskJobUpdate = TaskJob;

export interface ShequInfo {
  id: number; // 社区 ID
  name?: string; // 社区名称（中文）
  shequ_name?: string; // 社区英文标识
  active_app?: string; // 绑定的第三方应用
}

export interface GetShequListParams {
  active_app?: string | null; // 过滤用的 active_app
}

export const getPhysicalTaskList = () =>
  http.get<TaskJob[], any>("/jol/api/task/list");

export const getPhysicalTaskListByCommunity = (jyh_shequ_id: number) =>
  http.get<TaskJob[], any>(`/jol/api/task/list/jyh_shequ_id/${jyh_shequ_id}`);

export const createPhysicalTask = (payload: TaskJobCreate) =>
  http.post<TaskJob, TaskJobCreate>("/jol/api/task/create", {
    data: payload
  });

export const updatePhysicalTask = (payload: TaskJobUpdate) =>
  http.post<TaskJob, TaskJobUpdate>("/jol/api/job/update", {
    data: payload
  });

export const deletePhysicalTask = (payload: {
  task_id: number;
  id?: string | null;
}) =>
  http.post<TaskJob, { task_id: number; id?: string | null }>(
    "/jol/api/job/delete",
    {
      data: payload
    }
  );

export const getShequList = (params?: GetShequListParams) =>
  http.get<ShequInfo[], any>("/api/jyh/shequ/list", {
    params: params || undefined
  });
