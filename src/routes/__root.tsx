import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { cn } from "cn";
import { useState } from "react";
import { createDataModule } from "../data/data-module";
import { DataModuleProvider } from "../data/data-module-provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

const bodyClassName = cn(
  "min-h-full overflow-x-hidden bg-background font-sans text-foreground antialiased",
  "bg-[image:radial-gradient(1100px_620px_at_-8%_-10%,color-mix(in_oklab,var(--electric-cyan)_10%,transparent),transparent_58%),radial-gradient(1050px_620px_at_112%_-12%,color-mix(in_oklab,var(--electric-cyan)_7%,transparent),transparent_62%)]",
  "before:pointer-events-none before:fixed before:inset-0 before:-z-1 before:opacity-16",
  "before:bg-[image:radial-gradient(circle_at_20%_15%,color-mix(in_oklab,var(--foreground)_8%,transparent),transparent_34%),radial-gradient(circle_at_78%_26%,color-mix(in_oklab,var(--electric-cyan)_5%,transparent),transparent_42%)]",
  "after:pointer-events-none after:fixed after:inset-0 after:-z-1 after:opacity-14",
  "after:bg-[image:linear-gradient(color-mix(in_oklab,var(--foreground)_7%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklab,var(--foreground)_6%,transparent)_1px,transparent_1px)]",
  "after:bg-[length:28px_28px] after:[mask-image:radial-gradient(circle_at_50%_30%,black,transparent_78%)]",
);

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Asad Ur Rahman — Senior Full-Stack Software Engineer",
      },
      {
        name: "description",
        content:
          "Asad Ur Rahman is a Senior Full-Stack Software Engineer based in Karachi, Pakistan.",
      },
      {
        property: "og:title",
        content: "Asad Ur Rahman — Senior Full-Stack Software Engineer",
      },
      {
        property: "og:description",
        content:
          "Asad Ur Rahman is a Senior Full-Stack Software Engineer based in Karachi, Pakistan.",
      },
      {
        property: "og:type",
        content: "website",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "data:,",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [dataModule] = useState(() => createDataModule({ queryClient }));

  return (
    <DataModuleProvider dataModule={dataModule}>
      <Outlet />
    </DataModuleProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className={bodyClassName}>
        {children}
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  );
}
