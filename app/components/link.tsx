import { JSX } from "../../deps.ts";
import { useRouter } from "./router.tsx";

interface LinkProps extends JSX.HTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function Link(props: LinkProps) {
  const router = useRouter();

  return (
    <a
      onClick={(e) => {
        e.preventDefault();
        router.navigate(e.currentTarget.href);
      }}
      {...props}
    />
  );
}
