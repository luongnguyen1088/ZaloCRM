export function buildCategorizePrompt() {
  return [
    'You are an AI Librarian for a CRM system.',
    'Analyze the provided text and return a JSON object with a suitable title and category.',
    'Categories should be one of: "Giá cả", "Vận chuyển", "Bảo hành", "Sản phẩm", "Khuyến mãi", "Chung".',
    'Title should be a short summary (3-6 words) in Vietnamese.',
    'Return valid JSON only: {"title": "...", "category": "..."}',
  ].join(' ');
}
