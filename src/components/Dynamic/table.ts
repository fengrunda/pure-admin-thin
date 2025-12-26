import cloneDeep from "lodash/cloneDeep";

export interface DynamicTableColumnConfig {
  visible?: boolean;
  checkAuth?: string | string[] | null;
  type?: string;
  sortable?: boolean;
  className?: string;
  labelClassName?: string;
  align?: string;
  headerAlign?: string;
  prop?: string;
  label?: string;
  width?: number | null;
  minWidth?: number | null;
  slotHeader?: string | null;
  slotContent?: string | null;
  formatter?: (row: any, column: any, cellValue: any, index: number) => any;
  fixed?: string | null;
  showOverflowTooltip?: boolean;
  childMap?: Map<any, DynamicTableColumnConfig> | null;
}

const COLUMN: Required<
  Omit<
    DynamicTableColumnConfig,
    "childMap" | "slotHeader" | "slotContent" | "fixed"
  >
> & {
  fixed: string | null;
  slotHeader: string | null;
  slotContent: string | null;
  childMap: Map<any, DynamicTableColumnConfig> | null;
} = {
  visible: true,
  checkAuth: null,
  type: "",
  sortable: false,
  className: "",
  labelClassName: "",
  align: "",
  headerAlign: "",
  prop: "",
  label: "",
  width: null,
  minWidth: null,
  slotHeader: null,
  slotContent: null,
  formatter: (_row, _column, cellValue) =>
    !cellValue && cellValue !== 0 ? "-" : cellValue,
  fixed: null,
  showOverflowTooltip: true,
  childMap: null
};

export const INIT_COLUMN = (defaultConfig: DynamicTableColumnConfig) =>
  cloneDeep({ ...COLUMN, ...defaultConfig });
