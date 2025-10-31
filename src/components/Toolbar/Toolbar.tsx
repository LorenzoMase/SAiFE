import { NodeToolbar, Position } from "@xyflow/react";
import { ShapeType } from "../shape/types";
import { Trash2 } from "react-feather";
import { useEffect, useState } from "react";

type ShapeNodeToolbarProps = {
  activeColor: string;
  activeShape: ShapeType;
  onColorChange?: (color: string) => void;
  onDeleteNode?: () => void;
};

function ShapeNodeToolbar({
  onColorChange = () => false,
  activeColor,
  onDeleteNode,
}: ShapeNodeToolbarProps) {
  const [iconName, setIconName] = useState("");

  const colors = [
    "#BDD7EE",
    "#F7CBAC",
    "#438D57",
    "#FFFFFF"
  ];

  return (
    <NodeToolbar 
      className="nowheel nodrag flex flex-col" 
      position={Position.Bottom}
      offset={10}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-0.5">
          {colors.map((color) => (
            <button
              key={color}
              style={{ backgroundColor: color, border: "1px solid black" }}
              onClick={() => onColorChange(color)}
              className={`color-swatch ${
                color === activeColor ? "active" : ""
              }`}
            />
          ))}
          {onDeleteNode ? (
            <button onClick={() => onDeleteNode()}>
              <Trash2 color={"#FF0000"}/>
            </button>
          ) : null}
        </div>
      </div>
    </NodeToolbar>
  );
}

export default ShapeNodeToolbar;
