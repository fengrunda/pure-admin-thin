const Layout = () => import("@/layout/index.vue");
const communityBreadcrumbParam = {
  paramKey: "jyh_shequ_id",
  titleKeys: ["shequName", "shequ_name"],
  fallback: "社区 {id}",
  insertAfterIndex: 1,
  disabled: true
};
const buildCommunityProps = (route: any) => ({
  jyh_shequ_id: Number(route.params.jyh_shequ_id),
  shequ_key: route.query.shequ_key ?? "",
  shequ_name:
    route.query.shequName ??
    route.params.shequ_name ??
    route.query.shequ_name ??
    ""
});
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
      props: route => buildCommunityProps(route),
      meta: {
        title: "体检任务",
        // keepAlive: true,
        showLink: false,
        activePath: "/community-config/list",
        breadcrumbParam: communityBreadcrumbParam
        // transition: {
        //   name: "none",
        //   enterTransition: "",
        //   leaveTransition: ""
        // }
      }
    },
    {
      path: "/community-config/:jyh_shequ_id/physical-task/:task_id/function-config/list",
      name: "CommunityConfigPhysicalTaskFunctionConfigList",
      component: () => import("@/views/physical-task/function-config/list.vue"),
      props: route => ({
        ...buildCommunityProps(route),
        task_id: Number(route.params.task_id)
      }),
      meta: {
        title: "功能配置",
        showLink: false,
        activePath: "/community-config/list",
        breadcrumbParam: communityBreadcrumbParam
      }
    },
    {
      path: "/community-config/:jyh_shequ_id/physical-task/:task_id/function-config/:config_id/config-page",
      name: "CommunityConfigPhysicalTaskFunctionConfigConfigPage",
      component: () =>
        import("@/views/physical-task/function-config/config-page.vue"),
      props: route => ({
        ...buildCommunityProps(route),
        task_id: Number(route.params.task_id),
        config_id: Number(route.params.config_id)
      }),
      meta: {
        title: "配置详情",
        showLink: false,
        activePath: "/community-config/list",
        breadcrumbParam: communityBreadcrumbParam
      }
    }
  ]
} satisfies RouteConfigsTable;
