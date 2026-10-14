# Coding Standards

## Styling

- **Tailwind first.** Write CSS only when Tailwind cannot express the style at all. Arbitrary values (`w-[min(36rem,90%)]`), arbitrary properties (`[mask-image:...]`) and `before:`/`after:` variants all count as possible, however long the class string gets.
- **Global element defaults are the exception.** A class only styles the element it sits on, so rules that must reach every instance of an element (`a`, `code`, `::selection`, `:focus-visible`, `*`) live in `@layer base` in `src/styles.css`.
- **Unavoidable CSS uses Tailwind's CSS features.** Design tokens go in `@theme`, reusable styles go in `@utility` (so `hover:`, `md:` and other variants still work), element defaults go in `@layer base`. No bare class selectors.
- **`@apply` only inside `@layer base`.** Share styles by extracting a React component, not an `@apply` class.
- **`style={}` only for values computed at runtime**, such as a width derived from data or a CSS variable set from JS.

## Components

- **Use shadcn components over raw HTML** whenever the shadcn registry has a component for the element's role (button, input, skeleton, card, separator, dialog, …). Add missing ones with `npx shadcn@latest add <name>`.
- **Structural and text elements stay plain HTML**: `main`, `section`, `nav`, `h1`–`h6`, `p`, `ul`, and so on.
- **Text links stay plain `<a>`** and take the global `a` style. Render `Button` as a link only when the link should look like a button.
- **Customize shadcn components at the call site** with `className` and their existing variants. Edit `src/components/ui/` only to add a variant that will be reused, and know that `shadcn add --overwrite` discards such edits.
