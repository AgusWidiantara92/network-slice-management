import { prisma } from '@/lib/prisma';
import { LLMProviderType } from '@/types';

export interface StructuredSliceCommand {
  intent: 'CREATE_SLICE' | 'UPDATE_SLICE' | 'DELETE_SLICE' | 'ISOLATE_TENANT' | 'UNKNOWN';
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
   * Process Natural Language Prompt -> Structured JSON Response
   */
  static async processPrompt(prompt: string) {
    let activeProvider = await this.getActiveProvider();

    // Fallback if no provider configured
    if (!activeProvider) {
      activeProvider = await prisma.lLMProvider.findFirst();
    }

    const providerType = activeProvider?.provider || 'MOCK';
    let rawResponseText = '';
    let parsed: StructuredSliceCommand;

    try {
      if (providerType === 'GEMINI' && activeProvider?.apiKey) {
        rawResponseText = await this.callGeminiApi(
          activeProvider.apiKey,
          activeProvider.modelName || 'gemini-1.5-flash',
          prompt
        );
      } else if (providerType === 'OPENAI' && activeProvider?.apiKey) {
        rawResponseText = await this.callOpenAiApi(
          activeProvider.apiKey,
          activeProvider.modelName || 'gpt-4o-mini',
          prompt
        );
      } else if (providerType === 'OLLAMA' && activeProvider?.apiUrl) {
        rawResponseText = await this.callOllamaApi(
          activeProvider.apiUrl,
          activeProvider.modelName || 'llama3',
          prompt
        );
      } else {
        // Fallback or MOCK engine
        rawResponseText = JSON.stringify(this.generateMockParse(prompt));
      }

      // Parse JSON output from text (strip markdown code block markers if present)
      const cleanJsonStr = rawResponseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      parsed = JSON.parse(cleanJsonStr);
    } catch (error) {
      console.warn('LLM parsing or API call error, falling back to rule-based engine:', error);
      parsed = this.generateMockParse(prompt);
      rawResponseText = JSON.stringify(parsed, null, 2);
    }

    // Record in database history if activeProvider exists
    let historyRecord = null;
    if (activeProvider) {
      historyRecord = await prisma.lLMHistory.create({
        data: {
          prompt,
          rawResponse: rawResponseText,
          parsedResponse: JSON.stringify(parsed),
          status: 'SUCCESS',
          providerId: activeProvider.id,
        },
      });
    }

    return {
      historyId: historyRecord?.id,
      providerName: activeProvider?.name || 'Mock AI Engine',
      prompt,
      parsedCommand: parsed,
      rawResponse: rawResponseText,
    };
  }

  /**
   * System Prompt Builder
   */
  private static buildSystemPrompt(userPrompt: string): string {
    return `
You are a Network Slicing Configuration Assistant for MikroTik RouterOS.
Analyze the user's natural language request and output STRICT JSON only (no markdown, no extra text).

JSON Schema:
{
  "intent": "CREATE_SLICE" | "UPDATE_SLICE" | "DELETE_SLICE" | "ISOLATE_TENANT" | "UNKNOWN",
  "action": "DEPLOY" | "MODIFY" | "REMOVE" | "NONE",
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
  "confidence": number (0.0 - 1.0),
  "explanation": string
}

User prompt: "${userPrompt}"
`;
  }

  /**
   * Call Google Gemini REST API
   */
  private static async callGeminiApi(apiKey: string, model: string, userPrompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: this.buildSystemPrompt(userPrompt) }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API HTTP Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  }

  /**
   * Call OpenAI API
   */
  private static async callOpenAiApi(apiKey: string, model: string, userPrompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: this.buildSystemPrompt(userPrompt) }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API HTTP Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '{}';
  }

  /**
   * Call Ollama Local API
   */
  private static async callOllamaApi(baseUrl: string, model: string, userPrompt: string): Promise<string> {
    const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const response = await fetch(`${cleanUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: this.buildSystemPrompt(userPrompt),
        format: 'json',
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API HTTP Error ${response.status}`);
    }

    const data = await response.json();
    return data.response || '{}';
  }

  /**
   * Smart Rule-Based Fallback / Mock NLP Parser
   */
  private static generateMockParse(userPrompt: string): StructuredSliceCommand {
    const text = userPrompt.toLowerCase();

    // Default intent
    let intent: StructuredSliceCommand['intent'] = 'CREATE_SLICE';
    let action: StructuredSliceCommand['action'] = 'DEPLOY';

    if (text.includes('hapus') || text.includes('delete') || text.includes('remove')) {
      intent = 'DELETE_SLICE';
      action = 'REMOVE';
    } else if (text.includes('ubah') || text.includes('update') || text.includes('edit')) {
      intent = 'UPDATE_SLICE';
      action = 'MODIFY';
    } else if (text.includes('isolasi') || text.includes('isolate') || text.includes('vrf')) {
      intent = 'ISOLATE_TENANT';
      action = 'DEPLOY';
    }

    // Extract parameters using regex patterns
    const vlanMatch = text.match(/vlan\s*(\d+)/i) || text.match(/vlanid\s*(\d+)/i);
    const vlanId = vlanMatch ? parseInt(vlanMatch[1], 10) : 100;

    const bwMatch = text.match(/(\d+\s*[mkg]b?ps?)/i) || text.match(/bandwidth\s*(\d+\w*)/i);
    const bandwidth = bwMatch ? bwMatch[1].toUpperCase().replace(/\s+/g, '') : '10M';

    // Tenant name extraction
    let tenantName = 'Tenant-A';
    const tenantMatch = text.match(/tenant\s+([a-zA-Z0-9_-]+)/i) || text.match(/untuk\s+([a-zA-Z0-9_-]+)/i);
    if (tenantMatch) {
      tenantName = tenantMatch[1];
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
      explanation: `Parsed natural language command for tenant "${tenantName}" with VLAN ${vlanId}, VRF ${vrfName}, and bandwidth ${bandwidth}.`,
    };
  }
}
