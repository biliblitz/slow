import { Outlet, useLoader } from "slow";
import { metadata as metadata$ } from "./loader.ts";
import { SlowCityProvider } from "../app/provider.tsx";

function App() {
  return <span>{"<App />  <script>"}</span>;
}

export default function () {
  const metadata = useLoader(metadata$);

  return (
    <SlowCityProvider>
      <head>
        <meta charSet="utf-8" />
        <title>{metadata.title}</title>
      </head>
      <body>
        <span>root</span>
        <a href="https://www.baidu.com">
          <App />
        </a>
        <Outlet />
      </body>
    </SlowCityProvider>
  );
}
