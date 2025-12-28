import { reactive, ref, type Ref } from "vue";

export type SortOrder = "" | "asc" | "desc";

export interface PaginationState<Result> {
  page: number;
  size: number;
  total: number;
  result: Result[];
}

export interface SortState {
  prop: string;
  order: SortOrder;
}

export interface UseListQueryOptions<
  Params extends Record<string, any>,
  Result
> {
  defaultParams?: Params;
  defaultPagination?: Partial<PaginationState<Result>>;
  defaultSort?: SortState;
  onParamsChange?: (params: Params) => void;
}

export interface UseListQueryReturn<
  Params extends Record<string, any>,
  Result
> {
  params: Ref<Params>;
  pagination: PaginationState<Result>;
  sort: Ref<SortState>;
  loading: Ref<boolean>;
  setLoading: (value: boolean) => void;
  withLoading: <T>(executor: () => Promise<T>) => Promise<T>;
  setParams: (params: Params) => void;
  updateParams: (partial: Partial<Params>) => void;
  resetParams: (params?: Params) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setResult: (result: Result[], total?: number) => void;
  setTotal: (total: number) => void;
  setSort: (payload: SortState) => void;
  reset: () => void;
}

export function useListQuery<Params extends Record<string, any>, Result>(
  options?: UseListQueryOptions<Params, Result>
): UseListQueryReturn<Params, Result> {
  const initialParams = options?.defaultParams
    ? { ...options.defaultParams }
    : ({} as Params);
  const initialPagination: PaginationState<Result> = {
    page: options?.defaultPagination?.page ?? 1,
    size: options?.defaultPagination?.size ?? 10,
    total: options?.defaultPagination?.total ?? 0,
    result: options?.defaultPagination?.result
      ? [...options.defaultPagination.result]
      : []
  };
  const initialSort: SortState = options?.defaultSort ?? {
    prop: "",
    order: ""
  };

  const params = ref<Params>(initialParams) as Ref<Params>;
  const pagination = reactive({
    ...initialPagination
  }) as PaginationState<Result>;
  const sort = ref<SortState>({ ...initialSort });
  const loading = ref(false);

  const withLoading = async <T>(executor: () => Promise<T>) => {
    loading.value = true;
    try {
      return await executor();
    } finally {
      loading.value = false;
    }
  };

  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  const emitParamsChange = (next: Params) => {
    if (options?.onParamsChange) {
      options.onParamsChange(next);
    }
  };

  const setParams = (next: Params) => {
    params.value = { ...next };
    emitParamsChange(params.value);
  };

  const updateParams = (partial: Partial<Params>) => {
    const merged = { ...params.value, ...partial };
    params.value = merged;
    emitParamsChange(params.value);
  };

  const resetParams = (next?: Params) => {
    const resetValue = next ?? { ...initialParams };
    params.value = resetValue as Params;
    emitParamsChange(params.value);
  };

  const setPage = (page: number) => {
    pagination.page = page;
  };

  const setPageSize = (size: number) => {
    pagination.size = size;
    pagination.page = 1;
  };

  const setResult = (result: Result[], total?: number) => {
    pagination.result = [...result];
    if (typeof total === "number") {
      pagination.total = total;
    }
  };

  const setTotal = (total: number) => {
    pagination.total = total;
  };

  const setSort = (payload: SortState) => {
    sort.value = { ...payload };
  };

  const reset = () => {
    resetParams();
    pagination.page = initialPagination.page;
    pagination.size = initialPagination.size;
    pagination.total = initialPagination.total;
    pagination.result = [...initialPagination.result];
    sort.value = { ...initialSort };
  };

  return {
    params,
    pagination,
    sort,
    loading,
    setLoading,
    withLoading,
    setParams,
    updateParams,
    resetParams,
    setPage,
    setPageSize,
    setResult,
    setTotal,
    setSort,
    reset
  };
}
