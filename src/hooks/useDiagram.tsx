import { useHelperLines } from "@/hooks/useHelperLines";
import {
  Edge,
  Node,
  NodeChange,
  OnConnect,
  IsValidConnection,
  OnEdgesDelete,
  OnNodeDrag,
  OnNodesDelete,
  SelectionDragHandler,
  addEdge,
  useReactFlow as useReactFlowHook,
  useStore, MarkerType,
} from "@xyflow/react";
import {
  DragEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import useUndoRedo from "./useUndoRedo";
import { useAppStore } from "@/components/store";
import { DEFAULT_ALGORITHM } from "@/components/edges/EditableEdge/constants";
import { ControlPointData } from "@/components/edges/EditableEdge";
import { MarkerDefinition } from "@/components/edges/MarkerDefinition";
import { debounce } from "lodash";
import {ShapeComponents} from "@components/shape/types";

export const useDiagram = () => {
  const useReactFlow = useReactFlowHook;
  const {
    screenToFlowPosition,
    setNodes,
    setEdges,
    getEdges,
    getEdge,
    getNodes,
  } = useReactFlow();
  const { undo, redo, canUndo, canRedo, takeSnapshot } = useUndoRedo();
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const connectingNodeId = useRef(null);
  const {
    HelperLines,
    handleHelperLines,
    helperLineHorizontal,
    helperLineVertical,
  } = useHelperLines();
  const onDragOver: DragEventHandler<HTMLDivElement> = (evt) => {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "move";
  };
  const [selectedNodeId, setSelectedNodeId] = useState<string>();

  const selectAllNodes = () => {
    setNodes((nodes) => nodes.map((node) => ({ ...node, selected: true })));
    setEdges((edges) => edges.map((edge) => ({ ...edge, selected: true })));
    /* setEdges((edges) =>
      edges.map((edge) => {
        //if (!isEditableEdge(edge)) return edge;

        const points = (edge.data?.points as ControlPointData[]) ?? [];
        const updatedPoints = points.map((point) => ({
          ...point,
          selected: true,
        }));
        const updatedData = { ...edge.data, points: updatedPoints };

        return { ...edge, data: updatedData };
      })
    ); */
  };

  const deselectAll = () => {
    setNodes((nodes) => nodes.map((node) => ({ ...node, selected: false })));
    setEdges((edges) => edges.map((edge) => ({ ...edge, selected: false })));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === "a") {
        event.preventDefault();
        selectAllNodes();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  /*   useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (selectedNodeId) {
      const selectedNode = getNode(selectedNodeId);
      if (selectedNode) {
        timeoutId = setTimeout(() => {
          setNodes((nodes) =>
            nodes.map((node) =>
              node.id === selectedNodeId ? { ...node, selected: true } : node
            )
          );
        }, 0);
      }
    }

    // Clean up the timeout when the component unmounts or when selectedNodeId changes
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [getNode, selectedNodeId, setNodes]); */

  const uploadJson = (jsonString: string) => {
    const diagramData = JSON.parse(jsonString);
    if (diagramData.nodes && diagramData.edges) {
      setNodes(diagramData.nodes);
      setEdges(diagramData.edges);
    } else {
      console.error(
        'Invalid JSON format. Expected an object with "nodes" and "edges" arrays.'
      );
    }
  };

  // this function is called when a node from the sidebar is dropped onto the react flow pane
  const onDrop: DragEventHandler<HTMLDivElement> = (evt) => {
    takeSnapshot();
    evt.preventDefault();
    const type = evt.dataTransfer.getData("application/reactflow");
    let width = 200;
    let height = 100;
    switch (type){
      case "circle":
        width = 200;
        height = 70;
        break;
      case "capsule":
        width = 42;
        height = 22;
        break;
    }

    // this will convert the pixel position of the node to the react flow coordinate system
    // so that a node is added at the correct position even when viewport is translated and/or zoomed in
    const position = screenToFlowPosition({ x: evt.clientX, y: evt.clientY });

    const newNode = {
      id: Date.now().toString(),
      type: "shape",
      position,
      style: { width: width, height: height },
      data: {
        type,
        contents: type === "capsule" ? "AND" : "",
        color: "#438D57",
      },
      selected: true,
    };

    setNodes((nodes) =>
      nodes.map((n) => ({ ...n, selected: false })).concat([newNode])
    );
    
    setTimeout(() => {
      const event = new CustomEvent('saveGraphToHistory');
      window.dispatchEvent(event);
    }, 100);
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const debouncedFunction = debounce(() => {
        handleHelperLines(changes, getNodes());
      }, 1); // 100ms delay

      debouncedFunction();
    },
    [getNodes, handleHelperLines]
  );

  // Inefficient method of dragging nodes
  /*   const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const debouncedFunction = debounce(() => {
        setNodes((nodes) =>
          applyNodeChanges(handleHelperLines(changes, nodes), nodes)
        );
      }, 1); // 100ms delay

      debouncedFunction();
    },
    [setNodes, handleHelperLines]
  ); */

  const isValidConnection: IsValidConnection = (edge) => {
    const existingConnection = getEdges().some(
        (e) => e.source === edge.source && e.target === edge.target
    );
    return edge.source !== edge.target && !existingConnection;
  };

  const onConnect: OnConnect = useCallback(
    (connection) => {
      takeSnapshot();
      const { connectionLinePath } = useAppStore.getState();
      const edge = {
          ...connection,
          id: `${Date.now()}-${connection.source}-${connection.target}`,
          type: "editable-edge",
          selected: true,
          markerStart: {
            type: MarkerType.Arrow,
          },
          markerEnd: {
            type: MarkerType.Arrow,
          },
          data: {
            // algorithm: DEFAULT_ALGORITHM,
            points: connectionLinePath.map(
                (point, i) =>
                    ({
                      ...point,
                      id: window.crypto.randomUUID(),
                      prev: i === 0 ? undefined : connectionLinePath[i - 1],
                      active: true,
                    } as ControlPointData)
            ),
          },
        };
      setEdges((edges) => addEdge({...edge, type: "editable-edge"}, edges));
    },
    [setEdges, takeSnapshot]
  );

  const onConnectStart = useCallback((_: any, { nodeId }: any) => {
    connectingNodeId.current = nodeId;
  }, []);

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent<Element, MouseEvent>, edge: Edge) => {
      setEditingEdgeId(edge.id);
    },
    []
  );

  const onNodeDragStart: OnNodeDrag = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);
  
  const onNodeDragStop: OnNodeDrag = useCallback(() => {
    setTimeout(() => {
      const event = new CustomEvent('saveGraphToHistory');
      window.dispatchEvent(event);
    }, 100);
  }, []);

  const onSelectionDragStart: SelectionDragHandler = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);
  
  const onSelectionDragStop: SelectionDragHandler = useCallback(() => {
    setTimeout(() => {
      const event = new CustomEvent('saveGraphToHistory');
      window.dispatchEvent(event);
    }, 100);
  }, []);

  const onNodesDelete: OnNodesDelete = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onEdgesDelete: OnEdgesDelete = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(undefined);
    setEditingEdgeId(null);
  }, []);

  const onNodeClick = useCallback((_event: any) => {
    setEditingEdgeId(null);
  }, []);

  const Markers = () => {
    return getEdges().map((edge, index) => {
      return (
        <MarkerDefinition
          key={index}
          id={`marker-${edge.id}`}
          color={`${edge.style?.stroke || "#a5a4a5"}`}
        />
      );
    });
  };

  return {
    onDragOver,
    onDrop,
    onNodesChange,
    onConnect,
    onConnectStart,
    selectedNodeId,
    setSelectedNodeId,
    HelperLines,
    helperLineHorizontal,
    helperLineVertical,
    onNodeDragStart,
    onNodeDragStop,
    onSelectionDragStart,
    onSelectionDragStop,
    onNodesDelete,
    onEdgesDelete,
    undo,
    redo,
    canRedo,
    canUndo,
    onEdgeClick,
    editingEdgeId,
    setEditingEdgeId,
    onPaneClick,
    onNodeClick,
    useReactFlow,
    Markers,
    getEdge,
    setEdges,
    isValidConnection,
    deselectAll,
    uploadJson,
  };
};
