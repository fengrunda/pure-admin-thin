import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons
} from "unocss";
import transformerVariantGroup from "@unocss/transformer-variant-group";
import transformerDirectives from "@unocss/transformer-directives";

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2
    })
  ],
  transformers: [transformerVariantGroup(), transformerDirectives()],
  safelist: [
    "flex",
    "items-center",
    "justify-center",
    "text-center",
    "w-full",
    "h-full"
  ]
});
