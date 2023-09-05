import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.201.0/assert/mod.ts";
import { compareRoutePaths, validateRoutePath } from "./route.ts";

Deno.test("route tests", () => {
  assertEquals(
    // input
    [
      ["about", "[name]"],
      ["about", "[name]", "password"],
      ["about", "[name]", "[else]"],
      ["about"],
      ["about", "foo"],
      [],
      ["post"],
      ["post", "about"],
      ["about", "bar"],
      ["about", "[name]", "[...]"],
      ["[...]"],
      ["about", "[...]"],
      ["about", "[name]", "username"],
      ["post", "[slot]"],
    ].sort(compareRoutePaths),
    // output
    [
      [],
      ["about"],
      ["about", "bar"],
      ["about", "foo"],
      ["about", "[name]"],
      ["about", "[name]", "password"],
      ["about", "[name]", "username"],
      ["about", "[name]", "[else]"],
      ["about", "[name]", "[...]"],
      ["about", "[...]"],
      ["post"],
      ["post", "about"],
      ["post", "[slot]"],
      ["[...]"],
    ]
  );
});

Deno.test("sort routes throws", () => {
  assertThrows(() => {
    [["[...]"], ["[...]"]].sort(compareRoutePaths);
  }, "duplicated catch all routes");

  assertThrows(() => {
    [["[bar]"], ["[foo]"]].sort(compareRoutePaths);
  }, "conflicted dynamic routes");

  assertThrows(() => {
    [["foo"], ["foo"]].sort(compareRoutePaths);
  }, "duplicated normal routes");
});

Deno.test("validate route path", () => {
  // should not throw
  validateRoutePath([]);
  validateRoutePath(["foo", "bar"]);
  validateRoutePath(["foo", "[bar]"]);
  validateRoutePath(["[foo]", "bar"]);
  validateRoutePath(["[foo]", "[bar]"]);

  validateRoutePath(["[...]"]);
  validateRoutePath(["foo", "[...]"]);
  validateRoutePath(["[foo]", "[...]"]);

  // should throws
  assertThrows(() => validateRoutePath(["[...]", "foo"]));
  assertThrows(() => validateRoutePath(["[...]", "[foo]"]));
  assertThrows(() => validateRoutePath(["[...]", "[...]"]));
});
