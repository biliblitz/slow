import { JSX } from "../../deps.ts";
import { useNavigate } from "./router.tsx";

interface LinkProps extends JSX.HTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function Link(props: LinkProps) {
  const navigate = useNavigate();

  return (
    <a
      onClick={(e) => (e.preventDefault(), navigate(e.currentTarget.href))}
      {...props}
    />
  );
}
