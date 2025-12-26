<script setup lang="ts">
import { isEqual } from "@pureadmin/utils";
import { useRoute, useRouter } from "vue-router";
import { ref, watch, onMounted, toRaw } from "vue";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";

const route = useRoute();
const levelList = ref([]);
const router = useRouter();
const multiTags: any = useMultiTagsStoreHook().multiTags;
const permissionStore = usePermissionStoreHook();

const normalizeParams = (params?: Record<string, any>) => {
  const source = params ?? {};
  const normalized: Record<string, any> = {};
  Object.keys(source).forEach(key => {
    const value = source[key];
    normalized[key] = Array.isArray(value)
      ? value.map(v => (v == null ? v : String(v)))
      : value == null
        ? value
        : String(value);
  });
  return normalized;
};

const pickParamsByPath = (path: string, params: Record<string, any>) => {
  const keys = Array.from(path.matchAll(/:([A-Za-z0-9_]+)/g)).map(m => m[1]);
  if (!keys.length) return undefined;
  const picked: Record<string, any> = {};
  keys.forEach(k => {
    if (params[k] !== undefined) picked[k] = params[k];
  });
  return picked;
};

const findRouteByName = (name: string, routes: any[]): any => {
  for (const item of routes) {
    if (item?.name === name) return item;
    if (item?.children?.length) {
      const child = findRouteByName(name, item.children);
      if (child) return child;
    }
  }
  return null;
};

const getPathListKey = (pathList?: any[]) => {
  if (!Array.isArray(pathList) || pathList.length === 0) return "";
  return pathList.join("-");
};

const getBreadcrumb = (): void => {
  // 优先从 tags 中拿到“携带 query/params 的当前路由信息”（用于保持点击回跳的参数）
  let currentTagRoute: any;
  if (Object.keys(route.query).length > 0) {
    multiTags.forEach(item => {
      if (isEqual(route.query, item?.query)) currentTagRoute = toRaw(item);
    });
  } else if (Object.keys(route.params).length > 0) {
    const currentParams = normalizeParams(route.params as any);
    multiTags.forEach(item => {
      if (isEqual(currentParams, normalizeParams(item?.params))) {
        currentTagRoute = toRaw(item);
      }
    });
  }

  const currentName = router.currentRoute.value.name as string;
  const routes = permissionStore.flatteningRoutes as any[];

  // 从 flatteningRoutes 中找到当前路由，并用 pathList 回溯父级链（不受 showLink 过滤影响）
  const currentRoute = routes?.find(r => r?.name === currentName);
  const pathKeyMap = new Map<string, any>();
  (routes || []).forEach(r => {
    const key = getPathListKey(r?.pathList);
    if (key) pathKeyMap.set(key, r);
  });

  const matched: any[] = [];
  if (currentRoute?.pathList?.length) {
    let cursor = [...currentRoute.pathList];
    while (cursor.length) {
      const key = getPathListKey(cursor);
      const node = key ? pathKeyMap.get(key) : null;
      if (node) matched.unshift(node);
      cursor = cursor.slice(0, -1);
    }
  } else if (currentRoute) {
    matched.push(currentRoute);
  }

  const currentQuery =
    Object.keys(route.query || {}).length > 0
      ? (route.query as any)
      : undefined;
  const currentParams =
    Object.keys(route.params || {}).length > 0
      ? (route.params as any)
      : undefined;

  const normalizedMatched = matched
    .filter(Boolean)
    .map(item => {
      const params = currentParams
        ? pickParamsByPath(item.path, currentParams)
        : undefined;
      return {
        ...item,
        params,
        query: currentQuery
      };
    })
    .filter(item => item?.meta && item?.meta.title);

  // 合并相邻同名 title
  let merged = normalizedMatched.filter((item, index) => {
    const prev = normalizedMatched[index - 1];
    if (!prev) return true;
    return prev?.meta?.title !== item?.meta?.title;
  });

  // 按路由 meta 配置，插入“动态参数对应的名称”节点（可选）
  const breadcrumbParam = (currentRoute?.meta as any)?.breadcrumbParam as
    | CustomizeRouteMeta["breadcrumbParam"]
    | undefined;
  if (breadcrumbParam?.paramKey) {
    const id =
      (route.params as any)?.[breadcrumbParam.paramKey] ??
      (route.query as any)?.[breadcrumbParam.paramKey];
    const idStr = id === undefined || id === null ? "" : String(id);

    const resolveTitle = () => {
      const keys = Array.isArray(breadcrumbParam.titleKeys)
        ? breadcrumbParam.titleKeys
        : [];
      for (const key of keys) {
        const qv = (route.query as any)?.[key];
        if (qv !== undefined && qv !== null && String(qv)) return String(qv);
        const pv = (route.params as any)?.[key];
        if (pv !== undefined && pv !== null && String(pv)) return String(pv);
      }
      if (breadcrumbParam.fallback) {
        return breadcrumbParam.fallback.replaceAll("{id}", idStr);
      }
      return idStr;
    };

    const title = idStr ? resolveTitle() : "";
    if (idStr && title && merged.length >= 1) {
      const insertAfterIndex =
        typeof breadcrumbParam.insertAfterIndex === "number"
          ? breadcrumbParam.insertAfterIndex
          : 1;
      const safeInsertIndex = Math.min(
        Math.max(insertAfterIndex, 1),
        merged.length - 1
      );
      const keyPrefix = breadcrumbParam.keyPrefix ?? "__breadcrumbParam__";
      const virtualKey = `${keyPrefix}${breadcrumbParam.paramKey}:${idStr}`;

      if (!merged.some(item => item?.path === virtualKey)) {
        merged = [
          ...merged.slice(0, safeInsertIndex),
          {
            path: virtualKey,
            meta: { title },
            disabled: breadcrumbParam.disabled ?? true
          },
          ...merged.slice(safeInsertIndex)
        ];
      }
    }
  }

  levelList.value = merged.map(item => {
    // 如果 tags 里存在更完整的当前路由信息，用它补齐（主要是 query/params）
    if (
      item?.name &&
      currentTagRoute?.name &&
      item.name === currentTagRoute.name
    ) {
      return { ...item, ...currentTagRoute };
    }
    return item;
  });
};

const handleLink = item => {
  if (item?.disabled) return;
  const { redirect, name, path } = item;
  if (redirect) {
    router.push(redirect as any);
  } else {
    if (name) {
      if (item.query) {
        router.push({
          name,
          query: item.query
        });
      } else if (item.params) {
        router.push({
          name,
          params: item.params
        });
      } else {
        router.push({ name });
      }
    } else {
      router.push({ path });
    }
  }
};

onMounted(() => {
  getBreadcrumb();
});

watch(
  () => route.path,
  () => {
    getBreadcrumb();
  },
  {
    deep: true
  }
);
</script>

<template>
  <el-breadcrumb class="leading-[50px]! select-none" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item
        v-for="item in levelList"
        :key="item.path"
        class="inline! items-stretch!"
      >
        <span v-if="item.disabled">{{ item.meta.title }}</span>
        <a v-else @click.prevent="handleLink(item)">
          {{ item.meta.title }}
        </a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>
