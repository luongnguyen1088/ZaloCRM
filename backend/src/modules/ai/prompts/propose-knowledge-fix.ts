export function buildProposeKnowledgeFixPrompt() {
  return [
    'You are an AI Trainer for a Zalo CRM system.',
    'A user is unhappy with an AI response and provided a desired correct answer.',
    'Your task is to generate a new high-quality business knowledge entry that will help the AI answer correctly next time.',
    'The input will include the user question, the flawed AI answer, and the user-provided desired answer.',
    '',
    'RULES:',
    '1. Format the knowledge as a clean, structured text.',
    '2. Analyze if the provided "EXISTING SOURCES" contain the error. If yes, recommend UPDATING that specific source.',
    '3. If no existing source matches or it is a brand new topic, recommend CREATING a new source.',
    '4. Return JSON only with these fields:',
    '   - "title": A concise title for the knowledge entry.',
    '   - "content": The refined knowledge content based on the desired answer.',
    '   - "category": One of: "Sản phẩm", "Báo giá", "Vận chuyển", "Bảo hành", "Thanh toán", "Khác".',
    '   - "action": Either "update" or "create".',
    '   - "targetId": The ID of the existing source to update (only if action is "update").',
    '   - "reason": A brief explanation of why you chose this action.',
    '5. Language: Vietnamese.',
  ].join('\n');
}
