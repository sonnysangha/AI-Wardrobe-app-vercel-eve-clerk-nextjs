import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    ...(process.env.BASE44_PUBLIC_HOST_SUFFIX
      ? [`3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`]
      : []),
    ...(process.env.BASE44_SANDBOX_HOST_DOMAIN
      ? [`.${process.env.BASE44_SANDBOX_HOST_DOMAIN}`]
      : []),
  ],
};

/** Mounts the stylist agent in `agent/` on this origin at `/eve/v1/*`, so `useEveAgent` needs no host. */
export default withEve(nextConfig);
