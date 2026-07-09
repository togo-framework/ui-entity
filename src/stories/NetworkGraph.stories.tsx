import type { Meta, StoryObj } from "@storybook/react";
import { NetworkGraph } from "../components/entity/NetworkGraph";

const meta: Meta<typeof NetworkGraph> = {
  title: "Components/Network Graph",
  component: NetworkGraph,
  tags: ["autodocs"],
  parameters: { docs: { story: { inline: false, height: "460px" } } },
};
export default meta;

export const Default: StoryObj<typeof NetworkGraph> = {
  args: {
    nodes: [
      { id: "a", label: "Gateway", group: "core" },
      { id: "b", label: "Auth", group: "core" },
      { id: "c", label: "Users", group: "data" },
      { id: "d", label: "Orders", group: "data" },
      { id: "e", label: "Billing", group: "service" },
      { id: "f", label: "Email", group: "service" },
      { id: "g", label: "Cache", group: "infra" },
    ],
    links: [
      { source: "a", target: "b" }, { source: "a", target: "c" }, { source: "a", target: "d" },
      { source: "d", target: "e" }, { source: "e", target: "f" }, { source: "b", target: "c" },
      { source: "c", target: "g" }, { source: "d", target: "g" },
    ],
  },
};
