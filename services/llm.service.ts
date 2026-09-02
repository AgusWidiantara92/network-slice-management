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
  static async getHistory(limit = 50) {
    return prisma.lLMHistory.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        provider: true,
      },
    });
  }

  /**
   * Clear all interaction history
   */
  static async clearHistory() {
    return prisma.lLMHistory.deleteMany({});
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

    // Record in database history (always save, even for Mock Engine)
    let historyRecord = null;
    try {
      let targetProvider = activeProvider;
      if (!targetProvider) {
        targetProvider = await prisma.lLMProvider.findFirst({ where: { provider: 'MOCK' } });
        if (!targetProvider) {
          targetProvider = await prisma.lLMProvider.create({
            data: {
              name: 'Smart Mock Engine',
              provider: 'MOCK',
              modelName: 'rule-based-v2',
              isActive: true,
            },
          });
        }
      }

      historyRecord = await prisma.lLMHistory.create({
        data: {
          prompt,
          rawResponse: rawResponseText,
          parsedResponse: JSON.stringify(parsed!),
          status: 'SUCCESS',
          providerId: targetProvider.id,
        },
      });
    } catch (e) {
      console.warn('Failed to record LLM History:', e);
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
    const answer = await LLMService.answerQuestion(text);
    return {
      intent: 'QUERY_INFO',
      action: 'NONE',
      parameters: {},
      confidence: 0.98,
      explanation: answer,
    };
  }

  /**
   * Answer any conversational question using pattern matching + DB queries
   */
  private static async answerQuestion(text: string): Promise<string> {
    // ── GREETINGS ──
    if (/^(halo|hai|hi|hey|hello|assalamu|selamat\s*(pagi|siang|sore|malam)|good\s*(morning|afternoon|evening))/i.test(text)) {
      return 'Halo Admin! 👋 Saya adalah AI Operations Assistant untuk Network Slice Management. Silakan tanyakan apa saja tentang sistem jaringan Anda, atau berikan perintah alokasi network slice. Contoh: "Berapa router yang saya miliki?" atau "Buatkan slice untuk Tenant Dosen dengan VLAN 105".';
    }

    // ── IDENTITY: "siapa saya" ──
    if (/siapa\s*(saya|aku|gua|gw)/i.test(text)) {
      return 'Anda login sebagai **Super Admin** — Administrator Sistem Network Slice Management MikroTik RouterOS. Anda memiliki akses penuh ke seluruh modul: Tenant, Router, Network Slice, Scheduler, Template, dan AI Operations.';
    }

    // ── IDENTITY: "siapa kamu" ──
    if (/siapa\s*(kamu|anda|kau|lo|lu)/i.test(text) || /kamu\s*(siapa|apa)/i.test(text)) {
      return 'Saya adalah **AI Operations Assistant** untuk sistem Network Slice Management berbasis MikroTik RouterOS. Saya bisa membantu Anda mengalokasikan VLAN, VRF, bandwidth, subnet, firewall, dan mengisolasi tenant secara otomatis melalui bahasa alami.';
    }

    // ── MODEL / ENGINE QUESTION ──
    if (/\b(model|engine|mesin|pakai\s*apa|gunakan\s*apa|provider|llm)\b/i.test(text)) {
      const activeProvider = await this.getActiveProvider();
      if (activeProvider) {
        return `Saat ini Anda terhubung ke LLM Provider **"${activeProvider.name}"** (${activeProvider.provider}) menggunakan model **${activeProvider.modelName || 'default'}**. Anda dapat mengelola provider di menu **LLM Settings**.`;
      }
      return 'Saat ini Anda menggunakan **Smart Mock AI Engine** (rule-based). Untuk pengalaman chat yang lebih cerdas seperti ChatGPT/Gemini, Anda bisa menambahkan API Key di menu **LLM Settings** → tambah provider Google Gemini (gratis di aistudio.google.com/apikey).';
    }

    // ── ROUTER QUERIES ──
    if (/\b(router|mikrotik|routeros)\b/i.test(text)) {
      const routers = await prisma.router.findMany({
        select: { name: true, host: true, port: true, status: true },
      });
      if (routers.length === 0) {
        return 'Belum ada router yang terdaftar di sistem. Silakan tambahkan router MikroTik di menu **Routers** → **Add Router**.';
      }
      const details = routers.map((r, i) =>
        `${i + 1}. **${r.name}** — IP: ${r.host}:${r.port}, Status: ${r.status}`
      ).join('\n');
      return `Anda memiliki **${routers.length} router** terdaftar:\n${details}`;
    }

    // ── TENANT QUERIES ──
    if (/\btenant\b/i.test(text)) {
      const tenants = await prisma.tenant.findMany({
        select: { name: true, status: true, description: true },
      });
      if (tenants.length === 0) {
        return 'Belum ada tenant yang terdaftar. Silakan tambahkan tenant baru di menu **Tenants** → **Add Tenant**.';
      }

      // Check if asking about a specific tenant's bandwidth
      if (/bandwidth/i.test(text)) {
        const slices = await prisma.networkSlice.findMany({
          select: { name: true, bandwidthTx: true, bandwidthRx: true, tenant: { select: { name: true } } },
        });
        if (slices.length === 0) {
          return 'Belum ada network slice yang dialokasikan. Bandwidth belum dikonfigurasi untuk tenant manapun.';
        }
        const info = slices.map((s) =>
          `• **${s.tenant?.name || 'Unknown'}** (${s.name}): Download ${s.bandwidthRx || '-'} / Upload ${s.bandwidthTx || '-'}`
        ).join('\n');
        return `Informasi bandwidth per tenant:\n${info}`;
      }

      const details = tenants.map((t, i) =>
        `${i + 1}. **${t.name}** — Status: ${t.status}${t.description ? `, Desc: ${t.description}` : ''}`
      ).join('\n');
      return `Saat ini terdapat **${tenants.length} tenant** terdaftar:\n${details}`;
    }

    // ── BANDWIDTH QUERIES ──
    if (/bandwidth|kecepatan|speed|throughput|kapasitas/i.test(text)) {
      const slices = await prisma.networkSlice.findMany({
        select: { name: true, bandwidthTx: true, bandwidthRx: true, tenant: { select: { name: true } }, router: { select: { name: true } } },
      });
      if (slices.length === 0) {
        return 'Belum ada alokasi bandwidth yang dikonfigurasi. Anda perlu membuat network slice terlebih dahulu.';
      }
      const info = slices.map((s) =>
        `• **${s.name}** (${s.tenant?.name || '-'} → ${s.router.name}): Download **${s.bandwidthRx || '-'}** / Upload **${s.bandwidthTx || '-'}**`
      ).join('\n');
      return `Alokasi bandwidth saat ini:\n${info}`;
    }

    // ── NETWORK SLICE QUERIES ──
    if (/\b(slice|network.?slice|alokasi)\b/i.test(text)) {
      const slices = await prisma.networkSlice.findMany({
        select: {
          name: true, vlanId: true, vrfName: true, subnet: true, gateway: true,
          bandwidthTx: true, bandwidthRx: true, status: true,
          tenant: { select: { name: true } }, router: { select: { name: true } },
        },
      });
      if (slices.length === 0) {
        return 'Belum ada network slice yang dialokasikan. Anda bisa membuat slice baru melalui menu **Network Slices** atau dengan mengetik perintah seperti: "Buatkan slice untuk Tenant Dosen VLAN 105 bandwidth 20M".';
      }
      const details = slices.map((s, i) =>
        `${i + 1}. **${s.name}** — Tenant: ${s.tenant?.name || '-'}, Router: ${s.router.name}, VLAN: ${s.vlanId || '-'}, VRF: ${s.vrfName || '-'}, Subnet: ${s.subnet || '-'}, Bandwidth: ${s.bandwidthRx || '-'}/${s.bandwidthTx || '-'}, Status: ${s.status}`
      ).join('\n');
      return `Terdapat **${slices.length} network slice** yang teralokasi:\n${details}`;
    }

    // ── VLAN CONCEPT ──
    if (/\b(vlan)\b/i.test(text) && /\b(apa|itu|jelaskan|explain|pengertian|definisi|fungsi)\b/i.test(text)) {
      return '**VLAN (Virtual Local Area Network)** adalah teknologi Layer 2 yang membagi satu switch fisik menjadi beberapa domain broadcast terpisah secara logis. Dalam konteks Network Slicing, setiap tenant mendapatkan VLAN ID unik (misalnya VLAN 100, 200, dst.) sehingga lalu lintas antar tenant terisolasi satu sama lain meskipun menggunakan infrastruktur fisik yang sama.';
    }

    // ── VRF CONCEPT ──
    if (/\b(vrf)\b/i.test(text) && /\b(apa|itu|jelaskan|explain|pengertian|definisi|fungsi)\b/i.test(text)) {
      return '**VRF (Virtual Routing and Forwarding)** adalah teknologi Layer 3 yang memungkinkan setiap tenant memiliki tabel routing independen pada satu router fisik. Dengan VRF, Tenant A dan Tenant B bisa menggunakan subnet IP yang sama (misalnya 192.168.1.0/24) tanpa saling mengganggu karena routing-nya terisolasi.';
    }

    // ── QoS CONCEPT ──
    if (/\b(qos|quality.?of.?service)\b/i.test(text)) {
      return '**QoS (Quality of Service)** pada MikroTik diimplementasikan melalui Queue dan Mangle untuk mengatur prioritas dan batasan bandwidth. Dalam Network Slicing, QoS memastikan setiap tenant mendapatkan bandwidth yang sudah dialokasikan tanpa saling mengganggu. Anda bisa mengatur bandwidth upload/download per slice di menu Network Slices.';
    }

    // ── SUBNET CONCEPT ──
    if (/\b(subnet|subnetting|cidr)\b/i.test(text) && /\b(apa|itu|jelaskan|explain)\b/i.test(text)) {
      return '**Subnetting** adalah pembagian jaringan IP menjadi sub-jaringan yang lebih kecil. Notasi CIDR seperti **/24** berarti 256 alamat IP (254 host usable). Dalam Network Slicing, setiap tenant mendapatkan subnet tersendiri (misal: 192.168.10.0/24 untuk Tenant A, 192.168.20.0/24 untuk Tenant B) untuk isolasi di Layer 3.';
    }

    // ── NETWORK SLICING CONCEPT ──
    if (/\b(network.?slicing|apa.?itu.?slice)\b/i.test(text)) {
      return '**Network Slicing** adalah teknik virtualisasi jaringan yang membagi satu infrastruktur fisik menjadi beberapa "slice" atau segmen virtual yang terisolasi. Setiap slice memiliki VLAN, VRF, subnet, dan alokasi bandwidth sendiri. Dalam aplikasi ini, setiap tenant kampus (Dosen, Mahasiswa, Tamu, dll.) mendapatkan slice jaringan tersendiri pada Router MikroTik.';
    }

    // ── FIREWALL CONCEPT ──
    if (/\b(firewall|filter|rule|aturan)\b/i.test(text) && /\b(apa|itu|jelaskan|bagaimana)\b/i.test(text)) {
      return '**Firewall** pada MikroTik mengatur aturan filter untuk mengontrol lalu lintas jaringan. Dalam Network Slicing, firewall profile **STRICT_ISOLATION** memastikan setiap tenant tidak bisa mengakses jaringan tenant lain, sementara tetap bisa mengakses internet melalui gateway yang sudah dialokasikan.';
    }

    // ── STATUS / SUMMARY SYSTEM ──
    if (/\b(status|ringkasan|summary|rangkuman|overview|dashboard)\b/i.test(text)) {
      const [tenantCount, routerCount, sliceCount] = await Promise.all([
        prisma.tenant.count(),
        prisma.router.count(),
        prisma.networkSlice.count(),
      ]);
      return `📊 **Ringkasan Sistem:**\n• Tenant terdaftar: **${tenantCount}**\n• Router terdaftar: **${routerCount}**\n• Network Slice aktif: **${sliceCount}**\n\nAnda bisa melihat detail lengkap di menu Dashboard atau menanyakan informasi spesifik kepada saya.`;
    }

    // ── HELP / GUIDE ──
    if (/\b(help|bantuan|bantu|tolong|cara|bagaimana|langkah|panduan|tutorial|guide)\b/i.test(text)) {
      return '📖 **Panduan Penggunaan AI Operations:**\n\n1. **Tanya Informasi** — "Berapa router saya?", "Status sistem?", "Apa itu VLAN?"\n2. **Buat Slice** — "Buatkan slice untuk Tenant Dosen dengan VLAN 105 bandwidth 20M"\n3. **Ubah Slice** — "Ubah bandwidth Tenant Mahasiswa menjadi 50M"\n4. **Hapus Slice** — "Hapus slice milik Tenant Tamu"\n5. **Isolasi** — "Isolasi Tenant Lab menggunakan VRF"\n\n💡 **Tips:** Untuk pengalaman chat lebih cerdas, tambahkan API Key Google Gemini (gratis) di menu **LLM Settings**.';
    }

    // ── THANK YOU ──
    if (/\b(terima\s*kasih|thanks|thank\s*you|makasih|thx|tq)\b/i.test(text)) {
      return 'Sama-sama, Admin! 😊 Jangan ragu untuk bertanya lagi jika ada yang perlu dibantu terkait konfigurasi jaringan.';
    }

    // ── COUNT QUERIES (berapa, jumlah) ──
    if (/\b(berapa|jumlah|total|count|hitung)\b/i.test(text)) {
      if (/tenant/i.test(text)) {
        const tenants = await prisma.tenant.findMany({ select: { name: true } });
        const names = tenants.map((t) => t.name).join(', ');
        return `Saat ini terdapat **${tenants.length} tenant** terdaftar${names ? `: ${names}` : '.'}`;
      }
      if (/router/i.test(text)) {
        const routers = await prisma.router.findMany({ select: { name: true, host: true } });
        const names = routers.map((r) => `${r.name} (${r.host})`).join(', ');
        return `Saat ini terdapat **${routers.length} router** terdaftar${names ? `: ${names}` : '.'}`;
      }
      if (/slice/i.test(text)) {
        const count = await prisma.networkSlice.count();
        return `Saat ini terdapat **${count} network slice** yang teralokasi.`;
      }
      // Generic count
      const [tenantCount, routerCount, sliceCount] = await Promise.all([
        prisma.tenant.count(),
        prisma.router.count(),
        prisma.networkSlice.count(),
      ]);
      return `📊 Jumlah data: **${tenantCount} tenant**, **${routerCount} router**, dan **${sliceCount} network slice** teralokasi.`;
    }

    // ── CATCH-ALL: Friendly default with system summary ──
    const [tenantCount, routerCount, sliceCount] = await Promise.all([
      prisma.tenant.count(),
      prisma.router.count(),
      prisma.networkSlice.count(),
    ]);
    return `Terima kasih atas pertanyaannya! Saat ini sistem Anda memiliki **${tenantCount} tenant**, **${routerCount} router**, dan **${sliceCount} network slice**.\n\nSaya bisa membantu Anda:\n• Menanyakan informasi (router, tenant, bandwidth, status)\n• Menjelaskan konsep jaringan (VLAN, VRF, QoS, Subnetting)\n• Mengalokasikan network slice melalui perintah bahasa alami\n\nCoba tanyakan: "Berapa bandwidth tenant saya?" atau "Buatkan slice untuk Tenant Dosen VLAN 105 bandwidth 20M".`;
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
