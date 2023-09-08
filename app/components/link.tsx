import { JSX, useCallback } from "../../deps.ts";
import { ServerDataResponse } from "../utils.ts";
import { useRouter } from "./router.tsx";

interface LinkProps extends JSX.HTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function Link(props: LinkProps) {
  const router = useRouter();

  const navigate = useCallback(async (href: string) => {
    // calculate target url
    const targetUrl = new URL(href, location.href);

    // if is the same page, then we don't need fetch any data
    if (targetUrl.pathname === location.pathname) {
      const targetAnchor = targetUrl.hash;
      const originAnchor = location.hash;

      // check if is hash update
      if (targetAnchor !== originAnchor && targetAnchor) {
        const targetElem = document.getElementById(targetAnchor.slice(1));
        targetElem?.scrollIntoView({ behavior: "smooth" });
        history.pushState({ url: location.href }, "", targetUrl);
        return;
      }

      // then there is nothing to do
      return;
    }

    // fix pathname for new target
    if (!targetUrl.pathname.endsWith("/")) {
      targetUrl.pathname += "/";
    }

    // fetch data
    const dataUrl = new URL(targetUrl);
    dataUrl.pathname += "s-data.json";
    console.log("now sending request to " + dataUrl.href);
    const response = await fetch(dataUrl);
    const data = await response.json() as ServerDataResponse;

    // if everything is ok
    if (data.ok === "data") {
      history.pushState({ url: location.href }, "", targetUrl);
      await router.updateRouteAfterNavigate(data);
    }
  }, []);

  return (
    <a
      onClick={(e) => {
        e.preventDefault();
        navigate(e.currentTarget.href);
      }}
      {...props}
    />
  );
}
