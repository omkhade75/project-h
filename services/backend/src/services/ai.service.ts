import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async askAi(workspaceId: string, query: string) {
    // A simplified AI response generator
    let response = "I'm sorry, I couldn't understand your request.";
    
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('sales') || lowerQuery.includes('revenue')) {
      response = "Our recent sales analysis shows a 15% increase in revenue this week, primarily driven by electronics and fashion departments.";
    } else if (lowerQuery.includes('inventory') || lowerQuery.includes('stock')) {
      response = "Inventory levels are stable, though 3 items are currently below the recommended reorder threshold. I suggest restocking immediately.";
    } else if (lowerQuery.includes('anomalies') || lowerQuery.includes('alert')) {
      response = "I have detected 2 anomalies: An energy surge in Roof Unit B and an expiry risk for Yogurt batches.";
    } else {
      response = "Based on my analysis, operations are running smoothly. Is there a specific metric you'd like me to review?";
    }

    return {
      success: true,
      data: {
        answer: response,
        context: "Mock AI Response for: " + query
      }
    };
  }
}
