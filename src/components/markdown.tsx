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
      className="prose prose-invert prose-a:text-primary"
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
