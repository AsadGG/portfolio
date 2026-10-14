import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useState } from "react";
import { createDataModule } from "../data/data-module";
import { DataModuleProvider } from "../data/data-module-provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

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
      <body>
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
