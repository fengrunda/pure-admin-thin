<script setup lang="ts">
import LayFrame from "../lay-frame/index.vue";
import LayFooter from "../lay-footer/index.vue";
import { useTags } from "@/layout/hooks/useTag";
import { useGlobal, isNumber } from "@pureadmin/utils";
import BackTopIcon from "@/assets/svg/back_top.svg?component";
import { h, computed, Transition, defineComponent } from "vue";
import { usePermissionStoreHook } from "@/store/modules/permission";

const props = defineProps({
  fixedHeader: Boolean
});

const { showModel } = useTags();
const { $storage, $config } = useGlobal<GlobalPropertiesApi>();

const isKeepAlive = computed(() => {
  return $config?.KeepAlive;
});

const transitions = computed(() => {
  return route => {
    return route.meta.transition;
  };
});

const hideTabs = computed(() => {
  return $storage?.configure.hideTabs;
});

const hideFooter = computed(() => {
  return $storage?.configure.hideFooter;
});

const stretch = computed(() => {
  return $storage?.configure.stretch;
});

const layout = computed(() => {
  return $storage?.layout.layout === "vertical";
});

const getMainWidth = computed(() => {
  return isNumber(stretch.value)
    ? stretch.value + "px"
    : stretch.value
      ? "1440px"
      : "100%";
});

const getSectionStyle = computed(() => {
  return [
    hideTabs.value && layout ? "padding-top: 48px;" : "",
    !hideTabs.value && layout
      ? showModel.value == "chrome"
        ? "padding-top: 85px;"
        : "padding-top: 81px;"
      : "",
    hideTabs.value && !layout.value ? "padding-top: 48px;" : "",
    !hideTabs.value && !layout.value
      ? showModel.value == "chrome"
        ? "padding-top: 85px;"
        : "padding-top: 81px;"
      : "",
    props.fixedHeader
      ? ""
      : `padding-top: 0;${
          hideTabs.value
            ? "min-height: calc(100vh - 48px);"
            : "min-height: calc(100vh - 86px);"
        }`
  ];
});

const transitionMain = defineComponent({
  props: {
    route: {
      type: undefined,
      required: true
    }
  },
  render() {
    const transitionName =
      transitions.value(this.route)?.name || "fade-transform";
    const enterTransition = transitions.value(this.route)?.enterTransition;
    const leaveTransition = transitions.value(this.route)?.leaveTransition;

    // 当 transitionName 为 "none" 时，直接返回子节点，不包裹 Transition（避免 HMR 时的 DOM 引用问题）
    const children = this.$slots.default?.() ?? [];
    const firstChild = children.length ? children[0] : null;

    if (transitionName === "none") {
      return firstChild;
    }

    return h(
      Transition,
      {
        name: enterTransition ? "pure-classes-transition" : transitionName,
        enterActiveClass: enterTransition
          ? `animate__animated ${enterTransition}`
          : undefined,
        leaveActiveClass: leaveTransition
          ? `animate__animated ${leaveTransition}`
          : undefined,
        mode: "out-in",
        appear: true
      },
      {
        // Transition 语义上只支持单个子节点；slots.default() 在 Vue3 中返回 VNode 数组
        // HMR / 频繁 patch 时若传入数组/fragment，可能触发 leavingVNode.el 为空（例如：leavingVNode.el[leaveCbKey]）
        default: () => firstChild
      }
    );
  }
});
</script>

<template>
  <section
    :class="[fixedHeader ? 'app-main' : 'app-main-nofixed-header']"
    :style="getSectionStyle"
  >
    <router-view>
      <template #default="{ Component, route }">
        <LayFrame :currComp="Component" :currRoute="route">
          <template #default="{ Comp, fullPath, frameInfo }">
            <el-scrollbar
              v-if="fixedHeader"
              :view-style="{
                display: 'flex',
                flex: 'auto',
                overflow: 'hidden',
                'flex-direction': 'column'
              }"
              :wrap-style="{
                display: 'flex',
                'flex-wrap': 'wrap',
                'max-width': getMainWidth,
                margin: '0 auto',
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
              }"
            >
              <el-backtop
                target=".app-main .el-scrollbar__wrap"
                title="回到顶部"
              >
                <BackTopIcon />
              </el-backtop>
              <div class="flex-grow-1 flex-shrink-1 flex flex-col">
                <transitionMain :route="route">
                  <keep-alive
                    v-if="isKeepAlive"
                    :include="usePermissionStoreHook().cachePageList"
                  >
                    <component
                      :is="Comp"
                      :key="fullPath"
                      class="main-content"
                      :frameInfo="frameInfo"
                    />
                  </keep-alive>
                  <component
                    :is="Comp"
                    v-else
                    :key="fullPath"
                    class="main-content"
                    :frameInfo="frameInfo"
                  />
                </transitionMain>
              </div>
              <LayFooter v-if="!hideFooter" />
            </el-scrollbar>
            <div v-else class="grow">
              <transitionMain :route="route">
                <keep-alive
                  v-if="isKeepAlive"
                  :include="usePermissionStoreHook().cachePageList"
                >
                  <component
                    :is="Comp"
                    :key="fullPath"
                    class="main-content"
                    :frameInfo="frameInfo"
                  />
                </keep-alive>
                <component
                  :is="Comp"
                  v-else
                  :key="fullPath"
                  class="main-content"
                  :frameInfo="frameInfo"
                />
              </transitionMain>
            </div>
          </template>
        </LayFrame>
      </template>
    </router-view>

    <!-- 页脚 -->
    <LayFooter v-if="!hideFooter && !fixedHeader" />
  </section>
</template>

<style scoped>
.app-main {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow-x: hidden;
}

.app-main-nofixed-header {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.main-content {
  margin: 24px;
}
</style>
