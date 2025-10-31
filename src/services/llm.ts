import { PlanInput, Itinerary, Provider } from '@/types';
import { useSettings } from '@/store/settings';

type ChatMessage = { role: 'system' | 'user'; content: string };

const systemPrompt = `你是一名专业旅行规划助手。根据用户的需求生成详细且可执行的行程，并给出预算分析。
输出必须是 JSON，对象结构如下：
{
  "destination": string,
  "days": [
    { "date": string, "activities": [ { "name": string, "address": string, "time": string, "notes": string } ], "hotel": string }
  ],
  "summary": string,
  "budget": { "currency": "CNY", "total": number, "breakdown": { "transportation": number, "lodging": number, "food": number, "tickets": number, "shopping": number, "misc": number }, "notes": string }
}
不要返回任何多余的文本。`;

export async function generateItinerary(input: PlanInput): Promise<Itinerary> {
  const s = useSettings.getState();
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `目的地: ${input.destination}\n日期: ${input.startDate} 到 ${input.endDate}\n预算(人民币): ${input.budgetCNY}\n同行人数: ${input.people}\n偏好: ${input.preferences}\n出发点: ${input.startAddress || (input.start ? `${input.start.lat},${input.start.lng}` : '未提供')}\n是否包含预算分析: ${input.includeBudget ? '是' : '否'}\n要求：活动给出可到访的具体地址；每天包含合理的酒店；如提供出发点，请按最优游览顺序考虑路线。`
    }
  ];

  const provider: Provider = s.provider;
  const model = s.model || (provider === 'dashscope' ? 'qwen-plus' : 'gpt-4o-mini');

  if (provider === 'dashscope') {
    if (!s.dashscopeKey) throw new Error('缺少 DashScope API Key，请在设置中填写');
    const resp = await fetch(`${s.dashscopeBase || 'https://dashscope.aliyuncs.com/compatible-mode/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${s.dashscopeKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: 'json_object' }
      })
    });
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(text);
  } else {
    if (!s.openaiKey) throw new Error('缺少 OpenAI API Key，请在设置中填写');
    const base = s.openaiBase || 'https://api.openai.com/v1';
    const resp = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${s.openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages, response_format: { type: 'json_object' } })
    });
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(text);
  }
}

export async function generateItineraryFromText(text: string): Promise<Itinerary> {
  const s = useSettings.getState();
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${text}\n请按以上描述生成行程与预算分析，输出严格遵守 JSON 结构。` }
  ];

  const provider: Provider = s.provider;
  const model = s.model || (provider === 'dashscope' ? 'qwen-plus' : 'gpt-4o-mini');

  if (provider === 'dashscope') {
    if (!s.dashscopeKey) throw new Error('缺少 DashScope API Key，请在设置中填写');
    const resp = await fetch(`${s.dashscopeBase || 'https://dashscope.aliyuncs.com/compatible-mode/v1'}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${s.dashscopeKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, response_format: { type: 'json_object' } })
    });
    const data = await resp.json();
    const t = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(t);
  } else {
    if (!s.openaiKey) throw new Error('缺少 OpenAI API Key，请在设置中填写');
    const base = s.openaiBase || 'https://api.openai.com/v1';
    const resp = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${s.openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, response_format: { type: 'json_object' } })
    });
    const data = await resp.json();
    const t = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(t);
  }
}