import { create } from 'zustand';
import { generateAIResponse } from '../config/gemini';

interface PaymentState {
  loading: boolean;
  error: string | null;
  generatePaymentReminder: (clientName: string, amount: number) => Promise<string>;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  loading: false,
  error: null,

  generatePaymentReminder: async (clientName: string, amount: number) => {
    set({ loading: true, error: null });
    try {
      const prompt = `Generate a polite payment reminder message for ${clientName} for the amount of INR ${amount}. The message should be professional but friendly.`;
      const message = await generateAIResponse(prompt);
      return message;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));