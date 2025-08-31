// AI Contract Assistant - Reminder Generation Logic
export const generateContractReminders = (contracts: Array<{
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
}>) => {
  const reminders: { [contractId: string]: string } = {};
  const now = Date.now();

  contracts.forEach(contract => {
    const daysSinceCreated = Math.floor(
      (now - new Date(contract.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    switch (contract.status) {
      case 'draft':
        if (daysSinceCreated >= 3) {
          reminders[contract.id] = 
            `📝 This draft has been sitting for ${daysSinceCreated} days. Consider reviewing and moving to negotiation.`;
        }
        break;

      case 'negotiating':
        if (daysSinceCreated >= 7) {
          reminders[contract.id] = 
            `💬 Negotiation ongoing for ${daysSinceCreated} days. Time to follow up with the counterparty?`;
        }
        break;

      case 'signed in':
        if (daysSinceCreated >= 14) {
          reminders[contract.id] = 
            `🔥 Hey, there's possibility to sign this deal in this week - it's been signed for ${daysSinceCreated} days. Time to start execution!`;
        } else if (daysSinceCreated >= 7) {
          reminders[contract.id] = 
            `📋 Contract signed ${daysSinceCreated} days ago. Prepare for project kickoff!`;
        }
        break;

      case 'in progress':
        if (daysSinceCreated >= 30) {
          reminders[contract.id] = 
            `⏰ This contract has been in progress for ${daysSinceCreated} days. Check if milestones are being met.`;
        } else if (daysSinceCreated >= 14) {
          reminders[contract.id] = 
            `🚀 Project running for ${daysSinceCreated} days. Consider sending a progress update to the client.`;
        }
        break;

      case 'completed':
        if (daysSinceCreated <= 30) {
          reminders[contract.id] = 
            `✅ Great job completing this contract! Consider asking for testimonials or referrals.`;
        }
        break;

      default:
        break;
    }
  });

  return reminders;
};

export const getStatusSuggestions = (status: string, redFlagsCount: number) => {
  const suggestions: string[] = [];

  switch (status) {
    case 'draft':
      suggestions.push('Review the contract terms thoroughly before moving to negotiation');
      if (redFlagsCount > 0) {
        suggestions.push(`Address the ${redFlagsCount} red flag${redFlagsCount > 1 ? 's' : ''} identified in the analysis`);
      }
      suggestions.push('Prepare your negotiation points and pushback strategies');
      break;

    case 'negotiating':
      suggestions.push('Keep track of all proposed changes in writing');
      suggestions.push('Set clear deadlines for negotiation rounds');
      suggestions.push('Consider scheduling a call to discuss complex terms');
      break;

    case 'signed in':
      suggestions.push('Confirm all parties have signed copies');
      suggestions.push('Set up project management tools and communication channels');
      suggestions.push('Schedule kickoff meeting with all stakeholders');
      break;

    case 'in progress':
      suggestions.push('Send regular progress updates to maintain transparency');
      suggestions.push('Track deliverables against agreed milestones');
      suggestions.push('Document any scope changes or additional requests');
      break;

    case 'completed':
      suggestions.push('Request feedback and testimonials from the client');
      suggestions.push('Ask for referrals to similar projects');
      suggestions.push('Archive project files and update your portfolio');
      break;
  }

  return suggestions;
};