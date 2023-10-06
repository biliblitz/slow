import { RouterHead, RouterOutlet, SlowCityProvider } from "slow";

/**
 * Attention Developer:
 * Please refrain from importing any additional dependencies in this file,
 * except for the built-in import from "slow".
 * Also, avoid creating or exporting any global Context for use in other files.
 * Modifying the dependencies or exporting a global Context may lead to unexpected behavior and dependency conflicts.
 * Please ensure that this file remains self-contained and independent to maintain code integrity and modularity.
 */
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
