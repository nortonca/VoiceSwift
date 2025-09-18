import { MCPServerItem } from "./MCPServerItem";
import { Plus, Settings } from "lucide-react";
import { useState } from "react";

interface MCPTool {
  type: "mcp";
  server_label: string;
  server_url: string;
  headers?: Record<string, string>;
  allowed_tools?: string[];
}

interface ToolsSectionProps {
  tools: MCPTool[];
  onToolsChange: (tools: MCPTool[]) => void;
}

const recommendedIntegrations: MCPTool[] = [
  {
    type: "mcp",
    server_label: "calendar",
    server_url: "https://server.smithery.ai/@upstash/calendar-mcp",
  },
  {
    type: "mcp",
    server_label: "crm",
    server_url: "https://server.smithery.ai/@upstash/crm-mcp",
  },
  {
    type: "mcp",
    server_label: "email",
    server_url: "https://mcp.zapier.com/api/mcp/s/gmail",
  },
  {
    type: "mcp",
    server_label: "context7",
    server_url: "https://server.smithery.ai/@upstash/context7-mcp/mcp?api_key=4de69e51-823f-4665-964b-e36342bec94b&profile=tasteless-sparrow-7hSAwY",
  },
  {
    type: "mcp",
    server_label: "deepwiki",
    server_url: "https://mcp.deepwiki.com/mcp",
  },
];

export function ToolsSection({ tools, onToolsChange }: ToolsSectionProps) {
  const [showAddServer, setShowAddServer] = useState(false);
  const [serverLabel, setServerLabel] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [headers, setHeaders] = useState<Record<string, string>>({});

  const handleRemove = (server_url: string) => {
    onToolsChange(tools.filter(t => t.server_url !== server_url));
  };

  const handleAddRecommended = (tool: MCPTool) => {
    onToolsChange([...tools, tool]);
  };

  const handleAddCustomServer = () => {
    if (serverLabel.trim() && serverUrl.trim()) {
      const tool: MCPTool = {
        type: "mcp",
        server_label: serverLabel.trim(),
        server_url: serverUrl.trim(),
        headers,
      };
      onToolsChange([...tools, tool]);
      setServerLabel("");
      setServerUrl("");
      setHeaders({});
      setShowAddServer(false);
    }
  };

  const availableIntegrations = recommendedIntegrations.filter(
    integration => !tools.find(t => t.server_url === integration.server_url)
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white/90">MCP Server Tools</h3>
        </div>
        <p className="text-sm text-white/60">Create dedicated tools for querying specific MCP servers. Each server becomes its own tool that the AI can use.</p>
      </div>

      {/* Connected MCP Tools */}
      {tools.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white/80">Connected Servers</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tools.map(tool => (
              <div key={tool.server_url} className="group relative rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-all duration-200 p-3">
                <div className="text-sm text-white/90 truncate">{tool.server_label}</div>
                <div className="text-[11px] text-white/50 truncate">{tool.server_url}</div>
                <div className="flex items-center justify-end mt-2">
                  <button
                    onClick={() => handleRemove(tool.server_url)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Server */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-white/80">Add MCP Server</h4>
          <button
            onClick={() => setShowAddServer(!showAddServer)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Server
          </button>
        </div>

        {showAddServer && (
          <div className="p-3 rounded-lg border border-white/10 bg-white/5 space-y-2">
            <input
              type="text"
              value={serverLabel}
              onChange={(e) => setServerLabel(e.target.value)}
              placeholder="Server label (e.g., context7)"
              className="w-full text-sm px-3 py-2 rounded-lg border border-white/10 bg-transparent text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://your-mcp-server.com/mcp"
              className="w-full text-sm px-3 py-2 rounded-lg border border-white/10 bg-transparent text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCustomServer}
                disabled={!serverLabel.trim() || !serverUrl.trim()}
                className="text-xs px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 disabled:opacity-50 transition-colors"
              >
                Add Server
              </button>
              <button
                onClick={() => {
                  setShowAddServer(false);
                  setServerLabel("");
                  setServerUrl("");
                }}
                className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 text-white/70 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recommended Integrations */}
      {availableIntegrations.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-white/80">Recommended Integrations</h4>
          <p className="text-xs text-white/50">Popular MCP servers you can integrate with one click</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableIntegrations.slice(0, 6).map(integration => (
              <div key={integration.server_url} className="group relative rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-all duration-200">
                <div className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm text-white/90 truncate">{integration.server_label}</div>
                    <div className="text-[11px] text-white/50 truncate">{integration.server_url}</div>
                  </div>
                  <button
                    onClick={() => handleAddRecommended(integration)}
                    className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-white/70 border border-white/20"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
