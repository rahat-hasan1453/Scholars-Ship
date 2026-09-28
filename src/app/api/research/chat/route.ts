import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, paperTitle, paperAbstract, paperVenue, authors } = body;

    const userPrompt = (message || '').trim().toLowerCase();

    let responseText = '';

    // Specialized Intent Detection & Response Generation for Research Assistance
    if (userPrompt.includes('simple') || userPrompt.includes('explain') || userPrompt.includes('easy') || userPrompt.includes('bujhe') || userPrompt.includes('summary')) {
      responseText = `📚 **Summary & Core Concept breakdown for "${paperTitle || 'this paper'}":**

1. **What this paper is about:**
   - This research focuses on solving key challenges in **${paperTitle ? paperTitle : 'academic methodologies'}**.
   - Published in *${paperVenue || 'Peer-Reviewed Conference'}*, authored by ${authors || 'leading scholars'}.

2. **Key Takeaway for Students:**
   - ${paperAbstract ? paperAbstract.slice(0, 220) + '...' : 'The authors evaluate empirical data to provide new framework guidelines for graduate researchers.'}

3. **Why it matters for your scholarship/SOP:**
   - You can cite this paper in your **Statement of Purpose (SOP)** or email outreach to demonstrate your background understanding of current research trends in this field.`;
    } else if (userPrompt.includes('method') || userPrompt.includes('how') || userPrompt.includes('technique') || userPrompt.includes('model')) {
      responseText = `🔬 **Methodology & Technical Approach:**

- **Research Design:** The authors employ an empirical framework combining quantitative data collection with controlled experiments.
- **Data & Setup:** Tested across real-world datasets with benchmarks to ensure high replicability.
- **Core Algorithm/Framework:** Uses state-of-the-art methodology to eliminate previous performance bottlenecks and improve precision.`;
    } else if (userPrompt.includes('cite') || userPrompt.includes('sop') || userPrompt.includes('email') || userPrompt.includes('professor')) {
      responseText = `💡 **How to cite/mention this in your Cold Email to a Professor:**

> *"Dear Professor ${authors ? authors.split(',')[0] : 'Dr. Smith'},\n\nI recently read your work '${paperTitle || 'on this research area'}' published in ${paperVenue || 'recent literature'}. I was particularly intrigued by your findings on ${paperAbstract ? paperAbstract.slice(0, 100) : 'the core methodology'} and would love to build upon this in your lab..."*

This demonstrates to the professor that you have actually read their work!`;
    } else {
      responseText = `🤖 **Research AI Assistant Response:**

Regarding **"${paperTitle || 'this paper'}"**:

${paperAbstract ? `> *" ${paperAbstract} "*\n\n` : ''}
Feel free to ask me:
- 💡 *"Explain this paper in simple terms"*
- 🔬 *"What is the main methodology?"*
- ✉️ *"How do I mention this paper when emailing the professor?"*
- 📄 *"Can I get the PDF or citation link?"*`;
    }

    return NextResponse.json({
      success: true,
      reply: responseText,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process AI research chat' },
      { status: 500 }
    );
  }
}
