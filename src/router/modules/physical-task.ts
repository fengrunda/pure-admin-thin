const Layout = () => import("@/layout/index.vue");
const LayRouterView = () =>
  import("@/layout/components/lay-router-view/index.vue");

export default {
  path: "/community-config",
  name: "CommunityConfig",
  component: Layout,
  redirect: "/community-config/list",
  meta: {
    icon: "ep:checked",
    title: "社区配置",
    rank: 1
  },
  children: [
    // 社区配置列表（入口页面，显示在菜单）
    {
      path: "/community-config/list",
      name: "CommunityConfigIndex",
      component: () => import("@/views/community-config/index.vue"),
      meta: {
        title: "社区配置" // 与父级相同，合并为一级菜单
      }
    },
    // 体检任务（中间层级，用于面包屑显示）
    {
      path: "/community-config/:jyh_shequ_id/physical-task",
      name: "CommunityConfigPhysicalTask",
      component: () => import("@/views/physical-task/index.vue"),
      props: route => ({
        jyh_shequ_id: Number(route.params.jyh_shequ_id),
        shequ_name:
          route.query.shequName ??
          route.params.shequ_name ??
          route.query.shequ_name ??
          ""
      }),
      meta: {
        title: "体检任务",
        keepAlive: true,
        showLink: false, // 不显示在菜单
        activePath: "/community-config/list", // 高亮社区配置菜单
        breadcrumbParam: {
          paramKey: "jyh_shequ_id",
          titleKeys: ["shequName", "shequ_name"],
          fallback: "社区 {id}",
          insertAfterIndex: 1,
          disabled: true
        }
      },
      children: [
        // 功能配置（中间层级，用于面包屑显示）
        {
          path: "/community-config/:jyh_shequ_id/physical-task/function-config",
          name: "CommunityConfigPhysicalTaskFunctionConfig",
          component: LayRouterView,
          meta: {
            title: "功能配置",
            showLink: false // 不显示在菜单
          },
          children: [
            // 功能配置列表
            {
              path: "/community-config/:jyh_shequ_id/physical-task/function-config/list",
              name: "CommunityConfigPhysicalTaskFunctionConfigList",
              component: () =>
                import("@/views/physical-task/function-config/list.vue"),
              meta: {
                title: "功能配置", // 与父级相同，面包屑合并显示
                showLink: false,
                activePath: "/community-config/list" // 高亮社区配置菜单
              }
            },
            // 配置详情
            {
              path: "/community-config/:jyh_shequ_id/physical-task/function-config/config-page",
              name: "CommunityConfigPhysicalTaskFunctionConfigConfigPage",
              component: () =>
                import("@/views/physical-task/function-config/config-page.vue"),
              meta: {
                title: "配置详情",
                showLink: false,
                activePath: "/community-config/list" // 高亮社区配置菜单
              }
            }
          ]
        }
      ]
    }
  ]
} satisfies RouteConfigsTable;
