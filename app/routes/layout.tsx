import { Outlet } from "slow";

export default function () {
  return (
    <div>
      <header class="h-5 bg-red-500 text-white">
        This is header
      </header>
      <Outlet />
    </div>
  );
}