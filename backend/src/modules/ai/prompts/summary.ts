export function buildSummaryPrompt(language: 'vi' | 'en') {
  const instructions = language === 'vi' 
    ? [
        'Bạn là chuyên viên phân tích CRM.',
        'Hãy tóm tắt hội thoại Zalo giúp nhân viên sale nắm bắt nhanh tình hình.',
        'Yêu cầu tóm tắt theo cấu trúc sau:',
        '1. MỤC ĐÍCH: Khách nhắn tin để làm gì?',
        '2. TRẠNG THÁI: Khách đang ở giai đoạn nào (tìm hiểu, đang cân nhắc, chốt deal)?',
        '3. CÂU HỎI CHÍNH: Những thắc mắc quan trọng nhất của khách.',
        '4. HÀNH ĐỘNG: Sale cần làm gì tiếp theo?',
        'Giữ cho nội dung cực kỳ ngắn gọn, súc tích (dưới 150 từ). Trình bày rõ ràng bằng tiếng Việt.',
      ]
    : [
        'You are a CRM Insights Specialist.',
        'Summarize the Zalo conversation for a sales agent.',
        'Structure the summary as follows:',
        '1. PURPOSE: Why did the customer contact us?',
        '2. STATUS: Where are they in the funnel (learning, considering, closing)?',
        '3. KEY QUESTIONS: Most important queries from the customer.',
        '4. NEXT ACTION: What should the agent do next?',
        'Keep it very concise (under 150 words). Reply in English.',
      ];

  return [
    ...instructions,
    'Return plain text only. Do not include metadata or AI greetings.',
    'If the conversation is too short or empty, just say "No information available".'
  ].join('\n');
}
