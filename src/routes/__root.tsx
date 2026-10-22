import geistLatinFont from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
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

import { BackgroundLayer } from "#/components/background-layer";
import { buttonVariants } from "#/components/ui/button";
import { createDataModule } from "#/data/data-module";
import { DataModuleProvider } from "#/data/data-module-provider";
import TanStackQueryDevtools from "#/integrations/tanstack-query/devtools";

import appCss from "#/styles.css?url";

const bodyClassName = cn(
  "min-h-full overflow-x-hidden bg-background font-sans text-foreground antialiased",
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
        name: "theme-color",
        content: "#0b0d17",
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
      // Fetch the body font alongside the stylesheet instead of after it.
      {
        rel: "preload",
        href: geistLatinFont,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [dataModule] = useState(() => createDataModule({ queryClient }));

  return (
    <DataModuleProvider dataModule={dataModule}>
      <BackgroundLayer />
      <div className="relative z-10">
        <Outlet />
      </div>
    </DataModuleProvider>
  );
}

function NotFound() {
  return (
    <main className="mx-auto grid min-h-svh w-[min(1200px,calc(100%-2.5rem))] place-content-center justify-items-center gap-6 text-center">
      <p
        aria-hidden="true"
        className="bg-linear-to-r from-primary via-sky-300 to-violet bg-clip-text font-mono text-sm tracking-[0.3em] text-transparent"
      >
        ERROR 404
      </p>
      <h1 className="text-5xl font-semibold tracking-[-0.04em] sm:text-7xl">
        Page not found
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        The page you requested doesn't exist.
      </p>
      <a
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-11 rounded-full bg-linear-to-r from-primary to-violet px-6 text-sm text-primary-foreground hover:text-primary-foreground",
        )}
        href={import.meta.env.BASE_URL}
      >
        Return to the home page
      </a>
    </main>
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
