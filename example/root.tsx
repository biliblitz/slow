import { Outlet, RouterHead, Scripts, SlowCityProvider } from "slow";

function App() {
  return <span>{"<App />  <script>"}</span>;
}

export default function () {
  return (
    <SlowCityProvider lang="en">
      <head>
        <meta charSet="utf-8" />
        <RouterHead />
      </head>
      <body>
        <span onClick={() => alert("works")}>root</span>
        <a href="/about-you">
          <App />
        </a>
        <Outlet />
        <Scripts />
      </body>
    </SlowCityProvider>
  );
}
