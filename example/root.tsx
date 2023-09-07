import { Outlet, RouterHead, Scripts, SlowCityProvider } from "slow";

function App() {
  return <span>{"<App />  <script>"}</span>;
}

export default function () {
  return (
    <SlowCityProvider>
      <head>
        <meta charSet="utf-8" />
        <RouterHead />
      </head>
      <body>
        <span>root</span>
        <a href="https://www.baidu.com">
          <App />
        </a>
        <Outlet />

        <Scripts />
      </body>
    </SlowCityProvider>
  );
}
