import { Outlet, useLoader } from "slow";
import { metadata as metadata$ } from "./loader.ts";
import { SlowCityProvider } from "../app/provider.tsx";

function App() {
  return <span>{"<App />"}</span>;
}

export default function () {
  const metadata = useLoader(metadata$);

  return (
    <SlowCityProvider>
      <head>
        <title>{metadata.title}</title>
      </head>
      <body>
        <a href="https://www.baidu.com">
          <App />
        </a>
        <Outlet />
      </body>
    </SlowCityProvider>
  );
}
