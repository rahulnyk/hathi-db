import { Plugin } from "unified";
import { visit, SKIP } from "unist-util-visit";
import { Parent, Node } from "unist";

interface TextNode extends Node {
    type: "text";
    value: string;
}

interface CustomNode extends Node {
    type: string;
    value?: string;
    data?: {
        hName: string;
        hProperties: {
            className: string[];
            onClick?: string;
            "data-content"?: string;
        };
    };
    children?: Node[];
}

const remarkContextPlugin: Plugin = () => (tree: Node) => {
    visit(
        tree,
        "text",
        (
            node: TextNode,
            index: number | undefined,
            parent: Parent | undefined
        ) => {
            if (
                index === undefined ||
                !parent ||
                !Array.isArray(parent.children)
            ) {
                return;
            }

            const value: string = node.value;
            const elements: CustomNode[] = [];
            let lastIndex = 0;
            const regex = /\[\[([^\]]+)\]\]/g;
            let match;

            while ((match = regex.exec(value)) !== null) {
                // Add text before the match
                if (match.index > lastIndex) {
                    elements.push({
                        type: "text",
                        value: value.slice(lastIndex, match.index),
                    });
                }

                // Add the context pill
                elements.push({
                    type: "contextPill",
                    data: {
                        hName: "span",
                        hProperties: {
                            className: ["context-pill", "cursor-pointer"],
                            "data-content": match[1],
                        },
                    },
                    children: [{ type: "text", value: match[1] } as TextNode],
                });

                lastIndex = regex.lastIndex;
            }

            // Add remaining text
            if (lastIndex < value.length) {
                elements.push({
                    type: "text",
                    value: value.slice(lastIndex),
                });
            }

            // Replace the node if we found matches
            if (elements.length > 1) {
                parent.children.splice(index, 1, ...elements);
                return SKIP;
            }
        }
    );
};

export default remarkContextPlugin;
