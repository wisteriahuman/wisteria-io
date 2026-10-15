import type { Element, Root, RootContent } from 'hast';

// rehype-mermaid が出した SVG を <figure class="mermaid"> で包み、記事の中で枠を付けられるようにする
export default function rehypeWrapMermaid() {
  return (tree: Root) => {
    const walk = (node: Root | Element) => {
      node.children = node.children.map((child): RootContent => {
        if (child.type !== 'element') return child;
        if (child.tagName === 'svg' && String(child.properties.id ?? '').startsWith('mermaid-')) {
          return { type: 'element', tagName: 'figure', properties: { className: ['mermaid'] }, children: [child] };
        }
        walk(child);
        return child;
      });
    };
    walk(tree);
  };
}
