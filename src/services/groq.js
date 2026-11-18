/**
 * Groq AI Client Service
 * Uses Groq's high-speed inference API with Llama 3.3 70B Versatile
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const getGroqApiKey = () => {
  return import.meta.env.VITE_GROQ_API_KEY || "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";
};

export const getGroqModel = () => {
  return import.meta.env.VITE_GROQ_MODEL || "openai/gpt-oss-120b";
};

/**
 * Execute chat completion with Groq API
 */
export async function callGroq({ messages, temperature = 0.2, responseFormat = null }) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error("Groq API Key is missing. Please check your environment variables.");
  }

  const payload = {
    model: getGroqModel(),
    messages,
    temperature,
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

/**
 * Audit content against a brand profile and knowledge base
 */
export async function auditContentWithAI({
  title,
  contentType,
  content,
  brandProfile,
  knowledgeBaseItems = []
}) {
  const brandContext = {
    name: brandProfile?.name || "Generic Brand",
    tagline: brandProfile?.tagline || "",
    industry: brandProfile?.industry || "",
    tone: brandProfile?.tone || "Professional, confident, clear, objective",
    targetAudience: brandProfile?.targetAudience || "Business and enterprise clients",
    approvedTerminology: brandProfile?.approvedTerminology || [],
    prohibitedWords: brandProfile?.prohibitedWords || [],
    writingRules: brandProfile?.writingRules || [],
    approvedFacts: knowledgeBaseItems.filter(item => item.type === "fact" || item.type === "approvedFact").map(f => f.text || f.title),
    approvedClaims: knowledgeBaseItems.filter(item => item.type === "claim" || item.type === "approvedClaim").map(c => c.text || c.title),
    prohibitedClaims: knowledgeBaseItems.filter(item => item.type === "prohibitedClaim").map(p => p.text || p.title)
  };

  const systemPrompt = `You are BrandProof AI, an elite enterprise brand governance auditor.
Your job is to thoroughly analyze marketing, sales, product, and corporate content against official brand guidelines.

You MUST detect:
1. Tone & Voice inconsistencies (vs: "${brandContext.tone}").
2. Brand messaging & positioning misalignment.
3. Terminology violations (must use approved terms: ${JSON.stringify(brandContext.approvedTerminology)}).
4. Prohibited words & phrases (must avoid: ${JSON.stringify(brandContext.prohibitedWords)}).
5. Unsupported or exaggerated promotional claims (compare strictly with verified facts: ${JSON.stringify(brandContext.approvedFacts)}).
6. Outdated or conflicting company facts.
7. Grammar, readability, and clarity.
8. Accessibility issues (e.g., obscure acronyms, readability grade, exclusionary phrasing).

EVIDENCE-BASED PRINCIPLES:
- Never fabricate sources or approved facts.
- If a claim has no corresponding approved fact in the brand knowledge base, mark it as "UNSUPPORTED_CLAIM" or "NEEDS_HUMAN_VERIFICATION" and status "Unverified", NOT proven false.
- For every issue, highlight the exact problematic text slice, explain WHY it fails brand guidelines, cite the rule/fact, and provide an accurate suggested replacement that preserves the author's intent while adhering to brand governance.

Return ONLY a valid JSON object matching this schema:
{
  "complianceScore": <number 0 to 100>,
  "summary": "<2-3 sentence executive evaluation of the content compliance>",
  "readabilityScore": "<High | Medium | Low>",
  "issuesCount": <number of total issues>,
  "issues": [
    {
      "id": "<unique_string>",
      "category": "<TONE | TERMINOLOGY | PROHIBITED_WORD | UNSUPPORTED_CLAIM | FACTUAL_MISMATCH | GRAMMAR_CLARITY | ACCESSIBILITY>",
      "severity": "<HIGH | MEDIUM | LOW | INFO>",
      "problematicText": "<exact phrase from content>",
      "explanation": "<detailed rationale of violation>",
      "relevantRuleOrFact": "<guideline rule or approved fact cited>",
      "suggestedCorrection": "<recommended revision for this specific text>",
      "confidence": <percentage 0 to 100>,
      "needsHumanVerification": <boolean>,
      "verificationStatus": "<Confirmed Violation | Unsupported Claim | Inconsistent | Unverified>"
    }
  ],
  "fullRewrittenVersion": "<complete rewrite of the submitted content incorporating all corrections while preserving original intent and voice>"
}`;

  const userPrompt = `Content Title: ${title || "Untitled"}
Content Type: ${contentType || "General"}
Brand: ${brandContext.name}

Brand Rules & Knowledge Context:
${JSON.stringify(brandContext, null, 2)}

Content to Audit:
"""
${content}
"""

Please audit the above text strictly and return only the structured JSON.`;

  const responseText = await callGroq({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.1,
    responseFormat: { type: "json_object" }
  });

  try {
    return JSON.parse(responseText);
  } catch (err) {
    // Attempt cleaning if markdown backticks wrapped
    const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  }
}

/**
 * Interactive Brand Assistant Chat
 */
export async function askBrandAssistant({
  userQuery,
  brandProfile,
  knowledgeBaseItems = [],
  chatHistory = []
}) {
  const brandContext = {
    name: brandProfile?.name || "Our Brand",
    tagline: brandProfile?.tagline || "",
    tone: brandProfile?.tone || "Professional, approachable, innovative",
    industry: brandProfile?.industry || "Technology SaaS",
    approvedTerminology: brandProfile?.approvedTerminology || [],
    prohibitedWords: brandProfile?.prohibitedWords || [],
    writingRules: brandProfile?.writingRules || [],
    approvedFacts: knowledgeBaseItems.map(k => `${k.type ? `[${k.type.toUpperCase()}] ` : ""}${k.title ? k.title + ': ' : ''}${k.text || ''}`)
  };

  const systemPrompt = `You are the BrandProof AI Brand Governance Assistant for "${brandContext.name}".
You help team members, copywriters, agency partners, and managers write compliant, on-brand content.

GROUNDING RULES:
1. Answer exclusively based on the provided brand context and knowledge base below.
2. DO NOT invent facts, statistics, historical milestones, or policies that are not present in the context.
3. If an answer cannot be determined from the guidelines, clearly advise the user that the knowledge base lacks this rule and suggest submitting it for brand team review.
4. Always provide practical, actionable examples and friendly, authoritative advice.

Current Brand Guidelines Context:
${JSON.stringify(brandContext, null, 2)}
`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...chatHistory.slice(-6).map(m => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text
    })),
    { role: "user", content: userQuery }
  ];

  return await callGroq({
    messages,
    temperature: 0.3
  });
}

/**
 * Extract Guidelines from Raw Text / Document
 */
export async function extractGuidelinesFromDoc({ documentTitle, documentText }) {
  const systemPrompt = `You are an AI Brand Guideline Extractor. 
Extract structured brand governance rules from the uploaded document text.
Extract:
- brandName
- tone (comma-separated descriptions)
- approvedTerminology (array of strings)
- prohibitedWords (array of strings)
- brandMessaging (array of slogans, key value props)
- approvedFacts (array of verified verifiable facts, stats, claims)
- prohibitedClaims (array of claims or guarantees we must never make)
- writingRules (array of specific grammar, formatting, or voice rules)

Return ONLY a valid JSON object matching the above keys.`;

  const responseText = await callGroq({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Document Title: ${documentTitle}\n\nDocument Text:\n${documentText.slice(0, 15000)}` }
    ],
    temperature: 0.2,
    responseFormat: { type: "json_object" }
  });

  try {
    return JSON.parse(responseText);
  } catch (err) {
    const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  }
}
