import { PlanInput, Itinerary, Provider } from '@/types';
import { useSettings } from '@/store/settings';

type ChatMessage = { role: 'system' | 'user'; content: string };

const systemPrompt = `你是一名专业旅行规划助手。根据用户的需求生成详细且可执行的行程。
输出必须是 JSON，对象结构如下：
{
  "destination": string,
  "days": [
    { "date": string, "activities": [ { "name": string, "address": string, "time": string, "notes": string } ], "hotel": string }
  ],
  "summary": string
}
不要返回任何多余的文本。`;

export async function generateItinerary(input: PlanInput): Promise<Itinerary> {
  const s = useSettings.getState();
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `目的地: ${input.destination}\n日期: ${input.startDate} 到 ${input.endDate}\n预算(人民币): ${input.budgetCNY}\n同行人数: ${input.people}\n偏好: ${input.preferences}`
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