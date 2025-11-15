// src/components/Placeholder.tsx
import React from "react";

interface PlaceholderProps {
  title: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title }) => {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>{title}</h2>
      <p>This is a placeholder screen. Content will be added here later.</p>
    </div>
  );
};

export default Placeholder;