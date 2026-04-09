import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Variant = "assistant" | "user";

const baseComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1
      className="text-base font-bold mt-2 mb-1 text-inherit border-b border-base-content/10 pb-0.5"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-sm font-bold mt-2 mb-1 text-inherit" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-sm font-semibold mt-1.5 mb-0.5 text-inherit" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-2 last:mb-0 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc pl-4 mb-2 space-y-0.5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal pl-4 mb-2 space-y-0.5" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-snug" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-2 border-primary/50 pl-2 my-2 opacity-90 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: (props) => <hr className="border-base-content/15 my-2" {...props} />,
  pre: ({ children, ...props }) => (
    <pre className="my-1 overflow-x-auto rounded-lg" {...props}>
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto max-w-full my-2 -mx-0.5">
      <table
        className="table table-sm table-zebra text-[11px] border border-base-300 w-full min-w-[min(100%,32rem)]"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: (props) => <thead {...props} />,
  tbody: (props) => <tbody {...props} />,
  tr: (props) => <tr {...props} />,
  th: ({ children, ...props }) => (
    <th className="whitespace-nowrap align-top font-semibold" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="align-top max-w-[14rem] break-words whitespace-normal" {...props}>
      {children}
    </td>
  ),
};

function codeComponent(variant: Variant): Components["code"] {
  return ({ className, children, ...props }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <code
          className={`block text-[11px] bg-base-300/70 p-2 rounded-md overflow-x-auto my-0.5 font-mono ${variant === "user" ? "text-primary-content" : "text-base-content"}`}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className={`text-[11px] px-1 py-0.5 rounded font-mono ${
          variant === "user"
            ? "bg-primary-content/20 text-primary-content"
            : "bg-base-300/80 text-base-content"
        }`}
        {...props}
      >
        {children}
      </code>
    );
  };
}

function anchorComponent(variant: Variant): Components["a"] {
  return ({ children, ...props }) => (
    <a
      className={
        variant === "user"
          ? "underline text-primary-content break-all opacity-95"
          : "underline text-primary break-all"
      }
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
}

export function ChatMarkdown({
  text,
  variant,
}: {
  text: string;
  variant: Variant;
}) {
  const components: Components = {
    ...baseComponents,
    code: codeComponent(variant),
    a: anchorComponent(variant),
  };

  return (
    <div className="text-sm [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
