import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools";

export const startMcpServer = async (): Promise<void> => {
  const server = new McpServer({ name: "yaguri-tools", version: "3.0.0" });
  registerAllTools(server);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("[mcp] Running on stdio");
};
