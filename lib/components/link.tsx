import { JSX } from "../../deps.ts";
import { useNavigate } from "./router.tsx";

interface LinkProps extends JSX.HTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function Link(props: LinkProps) {
  const navigate = useNavigate();

  return (
    <a
      onClick={(e) => {
        const target = new URL(e.currentTarget.href, location.href);
        if (target.host === location.host) {
          e.preventDefault();
          navigate(target);
        }
      }}
      {...props}
    />
  );
}
