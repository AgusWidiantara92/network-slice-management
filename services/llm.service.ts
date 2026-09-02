import { prisma } from '@/lib/prisma';
import { LLMProviderType } from '@/types';

export interface StructuredSliceCommand {
  intent: 'CREATE_SLICE' | 'UPDATE_SLICE' | 'DELETE_SLICE' | 'ISOLATE_TENANT' | 'QUERY_INFO' | 'UNKNOWN';
  action: 'DEPLOY' | 'MODIFY' | 'REMOVE' | 'NONE';
  parameters: {
    tenantName?: string | null;
    vlanId?: number | null;
    vrfName?: string | null;
    subnet?: string | null;
    gateway?: string | null;
    bandwidthTx?: string | null;
    bandwidthRx?: string | null;
    firewallProfile?: string | null;
    routerId?: string | null;
  };
  confidence: number;
  explanation: string;
}

export class LLMService {
  /**
   * Get active LLM Provider from DB
   */
  static async getActiveProvider() {
    return prisma.lLMProvider.findFirst({
      where: { isActive: true },
    });
  }

  /**
   * List all configured LLM Providers
   */
  static async getAllProviders() {
    return prisma.lLMProvider.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Create or update LLM Provider
   */
  static async upsertProvider(data: {
    id?: string;
    name: string;
    provider: LLMProviderType;
    apiKey?: string;
    modelName: string;
    apiUrl?: string;
    isActive?: boolean;
  }) {
    if (data.isActive) {
      // Deactivate all other providers if setting this one active
      await prisma.lLMProvider.updateMany({
        data: { isActive: false },
      });
    }

    if (data.id) {
      return prisma.lLMProvider.update({
        where: { id: data.id },
        data,
      });
    }

    return prisma.lLMProvider.create({
      data: {
        name: data.name,
        provider: data.provider,
        apiKey: data.apiKey,
        modelName: data.modelName,
        apiUrl: data.apiUrl,
        isActive: data.isActive ?? false,
      },
    });
  }

  /**
   * Set active provider by ID
   */
  static async setActiveProvider(id: string) {
    await prisma.lLMProvider.updateMany({
      data: { isActive: false },
    });

    return prisma.lLMProvider.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Delete LLM Provider
   */
  static async deleteProvider(id: string) {
    return prisma.lLMProvider.delete({
      where: { id },
    });
  }

  /**
   * Get interaction history
   */
  static async getHistory(limit = 20) {
    return prisma.lLMHistory.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        provider: true,
      },
    });
  }

  /**
   * Process Natural Language Prompt -> Structured JSON Response (supports chat history)
   */
  static async processPrompt(
    prompt: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ) {
    let activeProvider = await this.getActiveProvider();

    // Fallback if no provider configured
    if (!activeProvider) {
      activeProvider = await prisma.lLMProvider.findFirst();
    }

    const providerType = activeProvider?.provider || 'MOCK';
    let rawResponseText = '';
    let parsed: StructuredSliceCommand;
    let usedMockFallback = false;

    try {
      if (providerType === 'GEMINI' && activeProvider?.apiKey) {
        rawResponseText = await this.callGeminiApi(
          activeProvider.apiKey,
          activeProvider.modelName || 'gemini-1.5-flash',
          prompt,
          chatHistory
        );
      } else if (providerType === 'OPENAI' && activeProvider?.apiKey) {
        rawResponseText = await this.callOpenAiApi(
          activeProvider.apiKey,
          activeProvider.modelName || 'gpt-4o-mini',
          prompt,
          chatHistory
        );
      } else if (providerType === 'OLLAMA' && activeProvider?.apiUrl) {
        rawResponseText = await this.callOllamaApi(
          activeProvider.apiUrl,
          activeProvider.modelName || 'llama3',
          prompt,
          chatHistory
        );
      } else {
        // No valid provider -> use smart mock engine
        usedMockFallback = true;
        const smartResponse = await this.generateSmartResponse(prompt);
        parsed = smartResponse;
        rawResponseText = JSON.stringify(parsed, null, 2);
      }

      if (!usedMockFallback) {
        // Parse LLM response
        const jsonMatch = rawResponseText.match(/```json\s*([\s\S]*?)\s*```/) || rawResponseText.match(/(\{[\s\S]*"intent"[\s\S]*\})/);
        if (jsonMatch) {
          try {
            const parsedObj = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            const textExplanation = rawResponseText.replace(/```json[\s\S]*?```/g, '').trim() || parsedObj.explanation;
            parsed = {
              ...parsedObj,
              explanation: textExplanation,
            };
          } catch {
            // JSON parse failed, treat entire response as conversational text
            parsed = {
              intent: 'QUERY_INFO',
              action: 'NONE',
              parameters: {},
              confidence: 0.95,
              explanation: rawResponseText,
            };
          }
        } else {
          // LLM returned natural conversational text (no JSON block)
          try {
            const directJson = JSON.parse(rawResponseText);
            parsed = directJson;
          } catch {
            parsed = {
              intent: 'QUERY_INFO',
              action: 'NONE',
              parameters: {},
              confidence: 0.95,
              explanation: rawResponseText,
            };
          }
        }
      }
    } catch (error) {
      console.warn('LLM API call error, falling back to smart mock engine:', error);
      usedMockFallback = true;
      parsed = await this.generateSmartResponse(prompt);
      rawResponseText = JSON.stringify(parsed, null, 2);
    }

    // Record in database history if activeProvider exists
    let historyRecord = null;
    if (activeProvider) {
      historyRecord = await prisma.lLMHistory.create({
        data: {
          prompt,
          rawResponse: rawResponseText,
          parsedResponse: JSON.stringify(parsed!),
          status: 'SUCCESS',
          providerId: activeProvider.id,
        },
      });
    }

    return {
      historyId: historyRecord?.id,
      providerName: usedMockFallback ? 'Smart Mock Engine' : activeProvider?.name || 'Unknown',
      parsedCommand: parsed!,
    };
  }

  /**
   * System Prompt Builder for Conversational AI with Real-Time DB Context
   */
  private static async getSystemInstruction(): Promise<string> {
    const [tenants, routers, slices] = await Promise.all([
      prisma.tenant.findMany({ select: { name: true } }),
      prisma.router.findMany({ select: { name: true, host: true, status: true } }),
      prisma.networkSlice.findMany({
        select: {
          name: true,
          vlanId: true,
          vrfName: true,
          subnet: true,
          gateway: true,
          bandwidthTx: true,
          bandwidthRx: true,
          status: true,
          tenant: { select: { name: true } },
          router: { select: { name: true, host: true } },
        },
      }),
    ]);

    const tenantNames = tenants.map((t) => t.name).join(', ') || 'Belum ada';
    const routerSummary = routers.map((r) => `${r.name} (${r.host}, status: ${r.status})`).join('; ') || 'Belum ada';
    const sliceSummary = slices.map((s) => 
      `- ${s.name} [Tenant: ${s.tenant?.name || 'Tanpa Tenant'}, Router: ${s.router.name}, VLAN: ${s.vlanId || '-'}, VRF: ${s.vrfName || '-'}, Subnet: ${s.subnet || '-'}, Gateway: ${s.gateway || '-'}, Bandwidth: Rx ${s.bandwidthRx} / Tx ${s.bandwidthTx}]`
    ).join('\n') || 'Belum ada';

    return `
You are a friendly, highly intelligent AI Assistant for a Network Slice Management Web Application on MikroTik RouterOS.

REAL-TIME SYSTEM STATE (DATABASE):
- Registered Tenants (${tenants.length}): ${tenantNames}
- Registered Routers (${routers.length}): ${routerSummary}
- Active Network Slices (${slices.length}):
${sliceSummary}

Instructions:
1. Speak natively in polite, natural, helpful Indonesian (like ChatGPT or Gemini).
2. Use the REAL-TIME SYSTEM STATE above to accurately answer questions about routers, tenants, bandwidths, VLANs, VRFs, subnets, and status.
3. If the user asks follow-up questions like "berapa bandwidthnya?", refer to the router, tenant, or slice discussed in history or real-time system state.
4. IF AND ONLY IF the user explicitly requests to CREATE, UPDATE, DELETE a network slice or ISOLATE a tenant, attach a JSON block at the VERY END of your response inside a markdown block:

\`\`\`json
{
  "intent": "CREATE_SLICE" | "UPDATE_SLICE" | "DELETE_SLICE" | "ISOLATE_TENANT",
  "action": "DEPLOY" | "MODIFY" | "REMOVE",
  "parameters": {
    "tenantName": string | null,
    "vlanId": number | null,
    "vrfName": string | null,
    "subnet": string | null,
    "gateway": string | null,
    "bandwidthTx": string | null,
    "bandwidthRx": string | null,
    "firewallProfile": string | null
  },
  "confidence": 0.95
}
\`\`\`

If the user is asking general questions, advice, greetings, bandwidth info, or status queries, DO NOT include any JSON block. Just provide your clear, conversational response text!
`;
  }

  /**
   * Call Google Gemini REST API with Chat History
   */
  private static async callGeminiApi(
    apiKey: string,
    model: string,
    userPrompt: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = history.map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }],
    });

    const systemInstructionText = await this.getSystemInstruction();

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstructionText }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API HTTP Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, Gemini tidak dapat memberikan respons.';
  }

  /**
   * Call OpenAI API with Chat History
   */
  private static async callOpenAiApi(
    apiKey: string,
    model: string,
    userPrompt: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    const systemInstructionText = await this.getSystemInstruction();
    const messages = [
      { role: 'system', content: systemInstructionText },
      ...history.map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
      { role: 'user', content: userPrompt },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API HTTP Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Maaf, OpenAI tidak dapat memberikan respons.';
  }

  /**
   * Call Ollama Local API with Chat History
   */
  private static async callOllamaApi(
    baseUrl: string,
    model: string,
    userPrompt: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const systemInstructionText = await this.getSystemInstruction();
    const messages = [
      { role: 'system', content: systemInstructionText },
      ...history.map((h) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
      { role: 'user', content: userPrompt },
    ];

    const response = await fetch(`${cleanUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API HTTP Error ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || 'Maaf, Ollama tidak dapat memberikan respons.';
  }

  /**
   * Smart Rule-Based Fallback / Mock NLP Parser
   */
  private static async generateSmartResponse(userPrompt: string): Promise<StructuredSliceCommand> {
    const text = userPrompt.toLowerCase().trim();

    // ── 0. CORRECTION OR PARAMETER UPDATE COMMAND (e.g., "nama tenantnya adalah Tenant-B") ──
    if (/nama\s+tenant(?:nya)?\s*(?:adalah|=)?\s*([a-zA-Z0-9_-]+)/i.test(text)) {
      return this.parseActionCommand(text);
    }

    // ── 1. ACTION COMMANDS (buat/hapus/ubah/isolasi) ──
    const hasActionKeyword =
      /\b(buat|buatkan|tambah|tambahkan|create|add)\b/.test(text) ||
      /\b(hapus|hapuskan|delete|remove)\b/.test(text) ||
      /\b(ubah|update|edit|perbarui|ganti)\b/.test(text) ||
      /\b(isolasi|isolate|pisahkan)\b/.test(text);

    if (hasActionKeyword && /\b(slice|tenant|vlan|vrf|jaringan|network)\b/.test(text)) {
      return this.parseActionCommand(text);
    }

    // ── 2. CONVERSATIONAL QUERIES (answered from DB) ──
    const answer = await this.answerQuestion(text);
    return {
      intent: 'QUERY_INFO',
      action: 'NONE',
      parameters: {},
      confidence: 0.98,
      explanation: answer,
    };
  }

  /**
   * Parse action commands (create/update/delete/isolate) into StructuredSliceCommand
   */
  private static parseActionCommand(text: string): StructuredSliceCommand {
    let intent: StructuredSliceCommand['intent'] = 'CREATE_SLICE';
    let action: StructuredSliceCommand['action'] = 'DEPLOY';

    if (/\b(hapus|hapuskan|delete|remove)\b/.test(text)) {
      intent = 'DELETE_SLICE';
      action = 'REMOVE';
    } else if (/\b(ubah|update|edit|perbarui|ganti)\b/.test(text)) {
      intent = 'UPDATE_SLICE';
      action = 'MODIFY';
    } else if (/\b(isolasi|isolate|pisahkan)\b/.test(text)) {
      intent = 'ISOLATE_TENANT';
      action = 'DEPLOY';
    }

    // ── VLAN Extraction (handles "vlan 10", "vlan id 10", "vlanid 10", "vlan: 10") ──
    const vlanMatch = text.match(/vlan\s*(?:id)?\s*:?\s*(\d+)/i) || text.match(/vlanid\s*(\d+)/i);
    const vlanId = vlanMatch ? parseInt(vlanMatch[1], 10) : 100;

    // ── Bandwidth Extraction (handles "10m", "10mbps", "bandwidth 10m") ──
    const bwMatch = text.match(/(\d+\s*[mkg]b?ps?)/i) || text.match(/bandwidth\s*(\d+\w*)/i);
    const bandwidth = bwMatch ? bwMatch[1].toUpperCase().replace(/\s+/g, '') : '10M';

    // ── Tenant Name Extraction with Stop-word handling ──
    let tenantName = 'Tenant-A';

    const matchA = text.match(/nama\s+tenant(?:nya)?\s*(?:adalah|=)?\s*([a-zA-Z0-9_-]+)/i);
    const matchB = text.match(/tenant\s+(?:dengan\s+nama|bernama|nama|dengan)?\s*([a-zA-Z0-9_-]+)/i);
    const matchC = text.match(/untuk\s+(?:tenant\s+)?([a-zA-Z0-9_-]+)/i);

    if (matchA) {
      tenantName = matchA[1];
    } else if (matchB) {
      let candidate = matchB[1];
      // If candidate matched a stop word like "dengan", skip to actual name
      if (['dengan', 'bernama', 'nama', 'untuk', 'yang', '1', '2', '3', 'sebuah', 'satu'].includes(candidate.toLowerCase())) {
        const matchAfterStop = text.match(/tenant\s+(?:dengan\s+nama|bernama|nama|dengan)\s+([a-zA-Z0-9_-]+)/i);
        if (matchAfterStop) candidate = matchAfterStop[1];
      }
      tenantName = candidate;
    } else if (matchC) {
      tenantName = matchC[1];
    }

    // Format single letters like "b" -> "Tenant-B"
    if (/^[a-zA-Z]$/.test(tenantName)) {
      tenantName = `Tenant-${tenantName.toUpperCase()}`;
    } else if (tenantName.toLowerCase().startsWith('tenant')) {
      tenantName = tenantName.charAt(0).toUpperCase() + tenantName.slice(1);
    }

    const vrfName = `${tenantName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_vrf`;
    const subnet = `192.168.${vlanId % 250}.0/24`;
    const gateway = `192.168.${vlanId % 250}.1`;

    return {
      intent,
      action,
      parameters: {
        tenantName,
        vlanId,
        vrfName,
        subnet,
        gateway,
        bandwidthTx: bandwidth,
        bandwidthRx: bandwidth,
        firewallProfile: 'STRICT_ISOLATION',
      },
      confidence: 0.95,
      explanation: `Instruksi terdeteksi: ${intent === 'CREATE_SLICE' ? 'Membuat' : intent === 'UPDATE_SLICE' ? 'Mengubah' : intent === 'DELETE_SLICE' ? 'Menghapus' : 'Mengisolasi'} network slice untuk tenant "${tenantName}" dengan VLAN ${vlanId}, VRF ${vrfName}, subnet ${subnet}, dan bandwidth ${bandwidth}.`,
    };
  }
}
