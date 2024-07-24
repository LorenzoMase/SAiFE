import { type Node, type Edge } from "@xyflow/react";
import { ShapeNodeData } from "./shape-node";

export const defaultNodes: Node<ShapeNodeData>[] = [
  {
    id: "4",
    type: "shape",
    position: { x: 200, y: 140 },
    style: { width: 120, height: 60 },
    data: {
      type: "hexagon",
      color: "#CF4C2C",
    },
    selected: false,
  },
];

export const defaultEdges: Edge[] = [
  {
    id: "1->2",
    source: "1",
    target: "2",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "editable-edge",
  },
  {
    id: "2->3",
    source: "2",
    target: "3",
    sourceHandle: "left",
    targetHandle: "right",
    type: "editable-edge",
  },
  {
    id: "2->4",
    source: "2",
    target: "4",
    sourceHandle: "right",
    targetHandle: "left",
    type: "editable-edge",
  },
  {
    id: "4->5",
    source: "4",
    target: "5",
    sourceHandle: "right",
    targetHandle: "top",
    type: "editable-edge",
  },
  {
    id: "3->6",
    source: "3",
    target: "6",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "editable-edge",
  },
  {
    id: "6->7",
    source: "6",
    target: "7",
    sourceHandle: "right",
    targetHandle: "left",
    type: "editable-edge",
  },
  {
    id: "4->7",
    source: "4",
    target: "7",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "editable-edge",
  },
  {
    id: "7->8",
    source: "7",
    target: "8",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "editable-edge",
  },
  {
    id: "5->9",
    source: "5",
    target: "9",
    sourceHandle: "left",
    targetHandle: "top",
    type: "editable-edge",
  },
  {
    id: "6->10",
    source: "6",
    target: "10",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "editable-edge",
  },
  {
    id: "10->8",
    source: "10",
    target: "8",
    sourceHandle: "right",
    targetHandle: "left",
    type: "editable-edge",
  },
];
