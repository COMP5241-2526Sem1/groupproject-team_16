const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: "804d1fe1-4b03-4483-9220-ccdfbffbeffd",
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

async function getDoubaoResponse(systemPrompt, userPrompt) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'doubao-1-5-lite-32k-250115',
    });
    return completion.choices[0]?.message?.content || '抱歉，未能生成回复';
  } catch (error) {
    console.error('调用豆包API时出错:', error);
    throw new Error('AI服务调用失败: ' + (error.message || '未知错误'));
  }
}

module.exports = getDoubaoResponse;