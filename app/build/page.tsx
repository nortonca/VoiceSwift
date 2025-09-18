"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pill } from "./components/Pill";
import { SectionTab } from "./components/SectionTab";
import { ActionButtons } from "./components/ActionButtons";
import { GeneralSection } from "./components/GeneralSection";
import { VoiceSection } from "./components/VoiceSection";
import { KnowledgeSection } from "./components/KnowledgeSection";
import { ToolsSection } from "./components/ToolsSection";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";


type Section = "general" | "voice" | "knowledge" | "tools";

export default function BuildPage() {
  const [section, setSection] = useState<Section>("general");

  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(true);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [company, setCompany] = useState("Annulus");
  const [startMessage, setStartMessage] = useState("Hello! I'm here to help you today. How can I assist you?");
  const [systemInstructions, setSystemInstructions] = useState("");

  const [selectedVoice, setSelectedVoice] = useState("alloy");

  const [knowledgeUrl, setKnowledgeUrl] = useState("");

  type MCPTool = {
    type: "mcp";
    server_label: string;
    server_url: string;
    headers?: Record<string, string>;
    allowed_tools?: string[];
  };
  const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);

  useEffect(() => {
    if (!hydrating) setDirty(true);
  }, [hydrating, name, desc, company, startMessage, systemInstructions, selectedVoice, knowledgeUrl, mcpTools]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Required";
    if (!selectedVoice) errs.selectedVoice = "Please select a voice model";
    return errs;
  };
  const [errors, setErrors] = useState<Record<string, string>>({});

  const listAgents = useQuery(api.agents.list, {});
  const createAgent = useMutation(api.agents.create);
  const updateAgent = useMutation(api.agents.update);

  // Hydrate initial state from first available agent (if any)
  useEffect(() => {
    if (!listAgents || hydrating === false) return;
    if (Array.isArray(listAgents) && listAgents.length > 0) {
      const a = listAgents[0] as any;
      setAgentId(a._id);
      setName(a.name ?? "");
      setDesc(a.description ?? "");
      setCompany(a.company ?? "");
      setStartMessage(a.startMessage ?? "");
      setSystemInstructions(a.systemInstructions ?? "");
      setSelectedVoice(a.voice ?? "alloy");
      setMcpTools(Array.isArray(a.tools) ? a.tools : []);
      setKnowledgeUrl(a.knowledgeUrl ?? "");
      setStatus(a.isActive ? "published" : "draft");
      setDirty(false);
    }
    setHydrating(false);
  }, [listAgents, hydrating]);

  const slug = useMemo(() => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }, [name]);

  const doSave = async () => {
    const errs = validate();
    setErrors(errs);
    if (saving || Object.keys(errs).length) return;
    setSaving(true);
    try {
      const common = {
        name: name.trim(),
        slug: slug || `${Date.now()}`,
        description: desc.trim(),
        company: company.trim(),
        startMessage: startMessage.trim(),
        systemInstructions: systemInstructions.trim(),
        voice: selectedVoice,
        knowledgeUrl: knowledgeUrl.trim(),
        isActive: status === "published",
        tools: mcpTools,
      } as const;

      if (agentId) {
        await updateAgent({ id: agentId as any, ...common });
      } else {
        const created = await createAgent({ ...common });
        if (created && (created as any)._id) setAgentId((created as any)._id);
      }
      setDirty(false);
      setLastSaved(new Date());
    } finally {
      setSaving(false);
    }
  };

  const doPublish = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus("published");
    if (dirty) doSave();
  };
  const doUnpublish = () => setStatus("draft");

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="flex-1 px-4 py-6 max-w-5xl mx-auto w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill ok={status === "published"} label={status === "published" ? "Published" : "Draft"} />
          {dirty && <span className="text-[11px] text-white/50">Unsaved changes</span>}
          {lastSaved && <span className="text-[11px] text-white/40">Last saved {fmt(lastSaved)}</span>}
        </div>
        <ActionButtons
          status={status}
          dirty={dirty}
          saving={saving}
          lastSaved={lastSaved}
          onSave={doSave}
          onPublish={doPublish}
          onUnpublish={doUnpublish}
        />
      </div>

      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 w-max">
        <SectionTab id="general" label="General" active={section === "general"} onClick={() => setSection("general")} />
        <SectionTab id="voice" label="Voice" active={section === "voice"} onClick={() => setSection("voice")} />
        <SectionTab id="knowledge" label="Knowledge Base" active={section === "knowledge"} onClick={() => setSection("knowledge")} />
        <SectionTab id="tools" label="Tools" active={section === "tools"} onClick={() => setSection("tools")} />
      </div>

      {section === "general" && (
        <GeneralSection
          name={name}
          onNameChange={setName}
          desc={desc}
          onDescChange={setDesc}
          company={company}
          onCompanyChange={setCompany}
          startMessage={startMessage}
          onStartMessageChange={setStartMessage}
          systemInstructions={systemInstructions}
          onSystemInstructionsChange={setSystemInstructions}
          errors={errors}
        />
      )}

      {section === "voice" && (
        <VoiceSection
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
        />
      )}

      {section === "knowledge" && (
        <KnowledgeSection
          knowledgeUrl={knowledgeUrl}
          onKnowledgeUrlChange={setKnowledgeUrl}
        />
      )}

      {section === "tools" && (
        <ToolsSection
          tools={mcpTools}
          onToolsChange={setMcpTools}
        />
      )}
    </div>
  );
}

