// 响应式storage
import type { App } from "vue";
import Storage from "responsive-storage";
import { routerArrays } from "@/layout/types";
import { responsiveStorageNameSpace } from "@/config";

export const injectResponsiveStorage = (app: App, config: PlatformConfigs) => {
  const nameSpace = responsiveStorageNameSpace();
  const storedConfigure = Storage.getData("configure", nameSpace) as any;
  const storedTags = Storage.getData("tags", nameSpace) as any;
  const forceMultiTagsCache = config.MultiTagsCache ?? false;
  const configObj = Object.assign(
    {
      // layout模式以及主题
      layout: Storage.getData("layout", nameSpace) ?? {
        layout: config.Layout ?? "vertical",
        theme: config.Theme ?? "light",
        darkMode: config.DarkMode ?? false,
        sidebarStatus: config.SidebarStatus ?? true,
        epThemeColor: config.EpThemeColor ?? "#409EFF",
        themeColor: config.Theme ?? "light", // 主题色（对应系统配置中的主题色，与theme不同的是它不会受到浅色、深色整体风格切换的影响，只会在手动点击主题色时改变）
        overallStyle: config.OverallStyle ?? "light" // 整体风格（浅色：light、深色：dark、自动：system）
      },
      // 系统配置-界面显示
      configure: Object.assign(
        {
          grey: config.Grey ?? false,
          weak: config.Weak ?? false,
          hideTabs: config.HideTabs ?? false,
          hideFooter: config.HideFooter ?? true,
          showLogo: config.ShowLogo ?? true,
          showModel: config.ShowModel ?? "smart",
          stretch: config.Stretch ?? false
        },
        storedConfigure ?? {},
        {
          // 以平台配置为准：保证“刷新保留 tabs”的行为稳定
          multiTagsCache: forceMultiTagsCache
        }
      )
    },
    forceMultiTagsCache
      ? {
          // 默认显示顶级菜单tag
          tags: storedTags ?? routerArrays
        }
      : {}
  );

  app.use(Storage, { nameSpace, memory: configObj });
};
