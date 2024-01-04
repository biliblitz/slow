import { useComputed, useSignalEffect } from "@preact/signals";
import { useManifest } from "../manifest/context.tsx";
import { ManifestInjector } from "../manifest/injector.tsx";
import { useRouter } from "./router.tsx";
import { ComponentType, h } from "preact";
import { LayoutBasicProps } from "../hooks/component.ts";

export function RouterOutlet() {
  const manifest = useManifest();
  const router = useRouter();

  const entryPath = manifest.basePath +
    manifest.assetNames[manifest.entryIndex];

  useSignalEffect(() => {
    console.log("outlets update =>", router.outlets.value);
  });

  const outlets = useComputed(() => {
    const [index, ...layouts] = router.outlets.value
      .map((id) => manifest.components[id])
      .reverse();
    return (layouts as ComponentType<LayoutBasicProps>[])
      .reduce((children, layout) => h(layout, { children }), h(index, null));
  });

  return (
    <>
      {outlets}
      <ManifestInjector />
      <script type="module" src={entryPath}></script>
    </>
  );
}
