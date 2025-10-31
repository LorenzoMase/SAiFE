import {
    Handle,
    NodeResizer,
    Position,
    useKeyPress,
    useReactFlow,
    useStore,
    useUpdateNodeInternals,
} from "@xyflow/react";

import Shape from "../shape";
import {type ShapeType} from "../shape/types";
import NodeLabel from "./label";
import ShapeNodeToolbar from "../Toolbar/Toolbar";
import {useEffect} from "react";
import useUndoRedo from "@/hooks/useUndoRedo";
import {fas} from "@fortawesome/free-solid-svg-icons";
import {library} from "@fortawesome/fontawesome-svg-core";

library.add(fas);

export type ShapeNodeData = {
    type: ShapeType;
    color: string;
};

// this will return the current dimensions of the node (measured internally by react flow)
const useNodeDimensions = (id: string) => {
    const node = useStore((state) => state.nodeLookup.get(id));
    return {
        width: node?.measured?.width || 0,
        height: node?.measured?.height || 0,
    };
};

const ShapeNode = ({id, selected, data}: any) => {
    const {color, type}: { color: string; type: ShapeType } = data as any;
    const {setNodes, getNodes, getEdges, setEdges} = useReactFlow();
    const updateNodeInternals = useUpdateNodeInternals();
    const {takeSnapshot} = useUndoRedo();
    const {width, height} = useNodeDimensions(id);
    const shiftKeyPressed = useKeyPress("Shift");
    const handleStyle = {backgroundColor: color};

    const isCapsule = type === 'capsule';
    const capsuleWidth = 40; // Capsule's fixed width
    const capsuleHeight = 20; // Capsule's fixed height
    const scaleFactor = 1; // Example scaling factor, use 1 for no scaling


    const onColorChange = (color: string) => {
        takeSnapshot();
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            color,
                        },
                    };
                }

                return node;
            })
        );
        
        setTimeout(() => {
            const event = new CustomEvent('saveGraphToHistory');
            window.dispatchEvent(event);
        }, 100);
    };

    const onResize = () => {
        updateNodeInternals(id);
    };
    
    const onResizeEnd = () => {
        setTimeout(() => {
            const event = new CustomEvent('saveGraphToHistory');
            window.dispatchEvent(event);
        }, 100);
    };

    const onContentsChange = (contents: any) => {
        takeSnapshot();
        setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id === id && node.data.type !== "capsule") {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            contents,
                        },
                    };
                }

                return node;
            })
        );
        
        setTimeout(() => {
            const event = new CustomEvent('saveGraphToHistory');
            window.dispatchEvent(event);
        }, 100);
    };

    const onDeleteNode = () => {
        takeSnapshot();
        
        const edges = getEdges();
        const nodes = getNodes();
        
        // BFS to find all parent nodes
        const findAllParents = (startNodeId: string): string[] => {
            const children: string[] = [];
            const queue: string[] = [startNodeId];
            const visited = new Set<string>();
            
            while (queue.length > 0) {
                const currentNodeId = queue.shift()!;
                
                if (visited.has(currentNodeId)) {
                    continue;
                }
                visited.add(currentNodeId);

                const parentEdges = edges.filter(edge => edge.target === currentNodeId);

                parentEdges.forEach(edge => {
                    const parentId = edge.source;
                    if (!visited.has(parentId)) {
                        children.push(parentId);
                        queue.push(parentId);
                    }
                });
            }
            
            return children;
        };

        const nodesToDelete = [id, ...findAllParents(id)];

        const edgesToKeep = edges.filter(edge => 
            !nodesToDelete.includes(edge.source) && !nodesToDelete.includes(edge.target)
        );
        
        const remainingNodes = nodes.filter(node => !nodesToDelete.includes(node.id));
        
        setNodes(remainingNodes);
        setEdges(edgesToKeep);
        
        // Trigger a save to graphs history after deletion
        setTimeout(() => {
            const event = new CustomEvent('saveGraphToHistory');
            window.dispatchEvent(event);
        }, 200);
    };

    useEffect(() => {
        updateNodeInternals(id);
    }, [id, updateNodeInternals]);

    return (
        <>
            <ShapeNodeToolbar
                onColorChange={onColorChange}
                activeShape={type}
                activeColor={color}
                onDeleteNode={onDeleteNode}
            />
            <NodeResizer
                color={color}
                keepAspectRatio={shiftKeyPressed}
                isVisible={selected}
                onResize={onResize}
                onResizeStart={takeSnapshot}
                onResizeEnd={onResizeEnd}
            />
            <div style={{position: "relative"}}>
                <Shape
                    type={type}
                    width={width}
                    height={height}
                    fill={color}
                    strokeWidth={1}
                    stroke={"#000"}
                    fillOpacity={0.8}
                />
            </div>
            <Handle
                style={handleStyle}
                id="top"
                type="source"
                position={Position.Top}
            />
            <Handle
                style={handleStyle}
                id="right"
                type="source"
                position={Position.Right}
            />
            <Handle
                style={handleStyle}
                id="bottom"
                type="source"
                position={Position.Bottom}
            />
            <Handle
                style={handleStyle}
                id="left"
                type="source"
                position={Position.Left}
            />
            <NodeLabel
                placeholder={data.type}
                data={data.contents}
                onContentsChange={onContentsChange}
            />
        </>
    );
};

export default ShapeNode;
