import type { Root } from "mdast";
import ReactMarkdown from "react-markdown";

type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
};

function remarkHtmlAsText() {
  return (tree: Root) => {
    const convertHtml = (node: MarkdownNode) => {
      if (node.type === "html") node.type = "text";
      node.children?.forEach(convertHtml);
    };
    convertHtml(tree as unknown as MarkdownNode);
  };
}

export function Markdown({ children }: { children: string }) {
  return (
    <div
      className="prose max-w-none prose-invert prose-p:leading-relaxed prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground prose-li:marker:text-primary/70"
      data-testid="markdown-content"
    >
      <ReactMarkdown
        remarkPlugins={[remarkHtmlAsText]}
        components={{
          a: ({ href, ...props }) => (
            <a
              {...props}
              href={href}
              rel="noopener noreferrer"
              target="_blank"
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
