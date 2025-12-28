<template>
  <el-dialog
    v-model="dialogVisible"
    append-to-body
    title="新增社区"
    width="480px"
    @close="handleCancel"
  >
    <div class="community-add-dialog">
      <DynamicFormV2 :formItems="formItems" />
    </div>
    <template #footer>
      <div class="community-add-dialog__footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button :loading="loading" type="primary" @click="handleConfirm">
          新增
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import type { DynamicFormItem } from "@/components/Dynamic/schema";
import DynamicFormV2 from "@/components/Dynamic/DynamicFormV2.vue";
import { INIT_ITEM } from "@/components/Dynamic/schema";
import type { CommunityShequ } from "@/api/community";
import {
  getCommunityShequList,
  updateCommunityActiveApp
} from "@/api/community";

const dialogVisible = ref(false);
const loading = ref(false);
const formItems = ref(new Map<string, DynamicFormItem>());
const allCommunities = ref<CommunityShequ[]>([]);

let resolveHandler: ((value: CommunityShequ) => void) | null = null;
let rejectHandler: (() => void) | null = null;

const communityChildMap = computed(() => {
  const map = new Map();
  allCommunities.value.forEach(option => {
    const label =
      option.name ?? option.shequ_name ?? `社区 ${option.id ?? "?"}`;
    const key = option.id ?? option.active_app ?? label;
    map.set(key, {
      label,
      value: option.id ?? label
    });
  });
  return map;
});

const buildFormItems = () => {
  const map = new Map<string, DynamicFormItem>();
  map.set(
    "community_id",
    INIT_ITEM({
      prop: "community_id",
      value: "",
      component: "el-select",
      childComponent: "el-option",
      childMap: communityChildMap.value,
      attrs: {
        placeholder: "请选择要新增的社区"
      },
      attrsFormItem: {
        label: "选择社区",
        rules: [{ required: true, message: "请选择社区", trigger: "change" }]
      },
      attrsCol: {
        span: 24
      }
    })
  );
  formItems.value = map;
};

const collectFormValues = () => {
  const data: { community_id?: any } = {};
  formItems.value.forEach((item, key) => {
    const prop = item.prop || key;
    (data as Record<string, any>)[prop] = item.value;
  });
  return data;
};

const loadAllCommunities = async () => {
  try {
    const result = await getCommunityShequList({ active_app: null });
    const list = Array.isArray(result?.data) ? result.data : [];
    allCommunities.value = list;
  } catch (error) {
    allCommunities.value = [];
  }
};

const resetPromise = () => {
  resolveHandler = null;
  rejectHandler = null;
};

const handleCancel = () => {
  dialogVisible.value = false;
  rejectHandler?.();
  resetPromise();
};

const handleConfirm = async () => {
  if (loading.value) return;
  const values = collectFormValues();
  if (!values.community_id) {
    ElMessage.warning("请选择要新增的社区");
    return;
  }

  loading.value = true;
  try {
    await updateCommunityActiveApp({
      shequ_id: values.community_id,
      active_app: "True"
    });
    ElMessage.success("新增社区成功");
    dialogVisible.value = false;
    resolveHandler?.(
      allCommunities.value.find(c => c.id === values.community_id)!
    );
  } catch (error) {
    ElMessage.error("新增社区失败");
    throw error;
  } finally {
    loading.value = false;
    resetPromise();
  }
};

const open = () => {
  console.log("CommunityAddDialog open called");
  loadAllCommunities().then(() => {
    console.log("Communities loaded:", allCommunities.value.length);
    buildFormItems();
    console.log("Form items built");
    dialogVisible.value = true;
    console.log("Dialog visible set to true");
  });
  return new Promise<CommunityShequ>((resolve, reject) => {
    resolveHandler = resolve;
    rejectHandler = reject;
  });
};

defineExpose({ open });
defineOptions({ name: "CommunityAddDialog" });
</script>

<style scoped lang="scss">
.community-add-dialog {
  min-width: 400px;
}

.community-add-dialog__footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
