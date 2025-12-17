import VueDevTools from "vite-plugin-vue-devtools";

const isDevtoolsEnabled = (value: unknown) =>
  value === true ||
  value === "true" ||
  (typeof value === "string" && value.toLowerCase() === "true");

export default function createDevtools(env) {
  const {
    VITE_OPEN_DEVTOOLS,
    VITE_DEVTOOLS_APPEND_TO,
    VITE_DEVTOOLS_LAUNCHEDITOR
  } = env;
  const config: any = {
    launchEditor: VITE_DEVTOOLS_LAUNCHEDITOR,
    appendTo: VITE_DEVTOOLS_APPEND_TO
  };

  return isDevtoolsEnabled(VITE_OPEN_DEVTOOLS) && VueDevTools(config);
}
