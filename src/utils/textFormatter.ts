export const formatText = (text: string): string => {
  if (!text) return '';
  
  let formattedText = text;
  
  // Handle links: [text](url)
  formattedText = formattedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: underline;">$1</a>');
  
  // Handle bold: *text*
  formattedText = formattedText.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  
  // Handle italics: _text_
  formattedText = formattedText.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // Handle highlight: `text`
  formattedText = formattedText.replace(/`([^`]+)`/g, '<span style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px;">$1</span>');
  
  // Handle underline: ~text~
  formattedText = formattedText.replace(/~([^~]+)~/g, '<span style="text-decoration: underline;">$1</span>');
  
  // Handle bullet points: - followed by space
  formattedText = formattedText.replace(/^- (.+)$/gm, '• $1');
  
  // Convert line breaks to <br> tags
  formattedText = formattedText.replace(/\n/g, '<br>');
  
  return formattedText;
};
