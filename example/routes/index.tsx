import { useLoader } from "slow";
import { username } from "./loader.ts";
import { user } from "./loader.user.ts";

export default function () {
  const name = useLoader(username);
  const usr = useLoader(user);

  return (
    <div>
      username = {name.username}, user = {usr.user}
    </div>
  );
}
