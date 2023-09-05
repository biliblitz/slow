import { Outlet } from "slow";

function App() {
  return <span>App</span>;
}

export default function () {
  return (
    <html>
      <head>
        <title>anything</title>
      </head>
      <body>
        <App />
        <a href="https://www.baidu.com">
          <Outlet />
        </a>
      </body>
    </html>
  );
}
