import type { Element, Root, RootContent } from 'hast';

// rehype-mermaid が出した SVG を <figure class="mermaid"> で包み、記事の中で罫線にそろえられるようにする
export default function rehypeWrapMermaid() {
  return (tree: Root) => {
    const walk = (node: Root | Element) => {
      node.children = node.children.map((child): RootContent => {
        if (child.type !== 'element') return child;
        if (child.tagName === 'svg' && String(child.properties.id ?? '').startsWith('mermaid-')) {
          // 枠の高さを罫線の倍数に切り上げるため、SVG の幅と縦横比を CSS に渡す（ADR-016）
          const [, , w, h] = String(child.properties.viewBox ?? '')
            .split(/\s+/)
            .map(Number);
          const style = w > 0 && h > 0 ? `--fw: ${w}px; --ratio: ${h / w}` : undefined;
          return {
            type: 'element',
            tagName: 'figure',
            properties: { className: ['mermaid'], style },
            children: [child],
          };
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}
