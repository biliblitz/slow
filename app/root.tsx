import { RouterHead, RouterOutlet, SlowCityProvider } from "slow";

export default function () {
  return (
    <SlowCityProvider lang="en">
      <head>
        <meta charSet="utf-8" />
        <RouterHead />
      </head>
      <body>
        <RouterOutlet />
      </body>
    </SlowCityProvider>
  );
}
